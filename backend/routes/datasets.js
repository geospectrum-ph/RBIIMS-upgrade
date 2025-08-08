const express = require("express");
const router = express.Router();
const sql = require("mssql");
const shapefile = require("shapefile");
const fs = require("fs");
const path = require("path");

function parseWKT(wkt) {
  if (!wkt) return null;

  const parts = wkt.match(/^([A-Z]+)\s*\((.*)\)$/i);
  if (!parts) return null;

  const geomType = parts[1].toUpperCase();
  const coordsStr = parts[2];

  try {
    switch (geomType) {
      case "POINT":
        const pointCoords = coordsStr.split(" ").map(Number);
        return {
          type: "Point",
          coordinates: pointCoords,
        };
      case "LINESTRING":
        const lineCoords = coordsStr.split(",").map((pair) => pair.trim().split(" ").map(Number));
        return {
          type: "LineString",
          coordinates: lineCoords,
        };
      case "POLYGON":
        const rings = coordsStr.split("),(").map((ring) =>
          ring
            .replace(/[()]/g, "")
            .split(",")
            .map((pair) => pair.trim().split(" ").map(Number))
        );
        return {
          type: "Polygon",
          coordinates: rings,
        };
      case "MULTIPOLYGON":
        const polygons = coordsStr.split(")),((").map((poly) =>
          poly
            .replace(/[()]/g, "")
            .split("),(")
            .map((ring) => ring.split(",").map((pair) => pair.trim().split(" ").map(Number)))
        );
        return {
          type: "MultiPolygon",
          coordinates: polygons,
        };
      default:
        return null;
    }
  } catch (e) {
    console.error("Error parsing WKT:", e);
    return null;
  }
}

function sanitizeColumnName(name) {
  // Remove special characters and ensure valid SQL column name
  return `[${name.replace(/[^a-zA-Z0-9_]/g, "_")}]`;
}

function formatValueForSql(value, columnType) {
  if (value === null || value === undefined) return "NULL";

  switch (columnType) {
    case "INT":
    case "FLOAT":
      return value;
    case "BIT":
      return value ? 1 : 0;
    case "DATETIME":
      return `'${new Date(value).toISOString()}'`;
    default:
      return `'${value.toString().replace(/'/g, "''")}'`;
  }
}

function createGeography(geojson) {
  if (!geojson || !geojson.type || !geojson.coordinates) {
    throw new Error("Invalid GeoJSON");
  }

  const srid = 4326;

  function ringArea(coords) {
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i];
      const [x2, y2] = coords[i + 1];
      area += x1 * y2 - x2 * y1;
    }
    return area / 2;
  }

  if (geojson.type === "Point") {
    const [lng, lat] = geojson.coordinates;
    return `geography::Point(${lat}, ${lng}, ${srid})`;
  }

  if (geojson.type === "LineString") {
    const coordinates = geojson.coordinates.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
    return `geography::STLineFromText('LINESTRING(${coordinates})', ${srid})`;
  }

  if (geojson.type === "Polygon") {
    const correctedRings = geojson.coordinates.map((ring, index) => {
      const area = ringArea(ring);
      const shouldBeCCW = index === 0;
      const isCCW = area > 0;
      const correctedRing = shouldBeCCW === isCCW ? ring : [...ring].reverse();
      return `(${correctedRing.map(([lng, lat]) => `${lng} ${lat}`).join(", ")})`;
    });

    const wkt = `POLYGON(${correctedRings.join(", ")})`;
    return `geography::STPolyFromText('${wkt}', ${srid})`;
  }

  if (geojson.type === "MultiPolygon") {
    const polygons = geojson.coordinates.map((poly) => {
      const correctedRings = poly.map((ring, index) => {
        const area = ringArea(ring);
        const shouldBeCCW = index === 0;
        const isCCW = area > 0;
        const correctedRing = shouldBeCCW === isCCW ? ring : [...ring].reverse();
        return `(${correctedRing.map(([lng, lat]) => `${lng} ${lat}`).join(", ")})`;
      });
      return `(${correctedRings.join(", ")})`;
    });

    const wkt = `MULTIPOLYGON(${polygons.join(", ")})`;
    return `geography::STGeomFromText('${wkt}', ${srid})`; // ✅ Fixed here
  }

  // fallback
  return `geography::STGeomFromText('${JSON.stringify(geojson)}', ${srid})`;
}

// Helper functions
function determineSqlType(value) {
  if (value === null || value === undefined) return "NVARCHAR(255)";
  switch (typeof value) {
    case "number":
      return Number.isInteger(value) ? "INT" : "FLOAT";
    case "boolean":
      return "BIT";
    case "string":
      return value.length > 255 ? "NVARCHAR(MAX)" : "NVARCHAR(255)";
    case "object":
      if (value instanceof Date) return "DATETIME";
      return "NVARCHAR(MAX)";
    default:
      return "NVARCHAR(255)";
  }
}

module.exports = (pool) => {
  router.post("/shapefiles", async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, error: "No files were uploaded." });
    }

    const { tableName, groupName } = req.body;
    const shpFile = req.files.shp;
    const dbfFile = req.files.dbf;

    if (!shpFile || !dbfFile) {
      return res.status(400).json({ success: false, error: "Both .shp and .dbf files are required." });
    }

    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const shpPath = path.join(uploadDir, shpFile.name);
    const dbfPath = path.join(uploadDir, dbfFile.name);

    try {
      await shpFile.mv(shpPath);
      await dbfFile.mv(dbfPath);

      const geojson = await shapefile.read(shpPath, dbfPath);

      if (!geojson.features || geojson.features.length === 0) {
        throw new Error("Shapefile contains no features.");
      }

      const sampleProps = geojson.features[0].properties || {};
      const propertyColumns = {};

      for (const [key, value] of Object.entries(sampleProps)) {
        propertyColumns[key] = determineSqlType(value);
      }

      // Check if table already exists
      const checkTable = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'
    `);
      if (checkTable.recordset.length > 0) {
        throw new Error(`Table "${tableName}" already exists.`);
      }

      // Build CREATE TABLE query
      let createTableQuery = `CREATE TABLE [${tableName}] (
      id BIGINT IDENTITY(1,1) PRIMARY KEY,
      geom GEOGRAPHY`;

      for (const [columnName, columnType] of Object.entries(propertyColumns)) {
        createTableQuery += `,\n  ${sanitizeColumnName(columnName)} ${columnType}`;
      }

      createTableQuery += `\n)`;

      await pool.request().query(createTableQuery);

      // Insert features in batches
      const batchSize = 100;
      for (let i = 0; i < geojson.features.length; i += batchSize) {
        const batch = geojson.features.slice(i, i + batchSize);
        const columns = Object.keys(propertyColumns);

        let insertQuery = `INSERT INTO [${tableName}] (geom`;
        columns.forEach((col) => (insertQuery += `, ${sanitizeColumnName(col)}`));
        insertQuery += `) VALUES `;

        const values = batch
          .map((feature) => {
            const geom = createGeography(feature.geometry);
            const props = feature.properties || {};
            let row = `(${geom}`;
            columns.forEach((col) => {
              row += `, ${formatValueForSql(props[col], propertyColumns[col])}`;
            });
            return row + `)`;
          })
          .join(", ");

        await pool.request().query(insertQuery + values);
      }

      // Ensure user_layers table exists
      await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_layers' AND xtype='U')
      CREATE TABLE user_layers (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        table_name NVARCHAR(255) NOT NULL,
        layer_name NVARCHAR(255) NOT NULL,
        group_name NVARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT GETDATE() NOT NULL,
        columns_json NVARCHAR(MAX)
      )
    `);

      const columnsJson = JSON.stringify(propertyColumns);

      await pool.request().input("tableName", sql.NVarChar(255), tableName).input("layerName", sql.NVarChar(255), tableName).input("groupName", sql.NVarChar(255), groupName).input("columnsJson", sql.NVarChar(sql.MAX), columnsJson).query(`
        INSERT INTO user_layers (table_name, layer_name, group_name, columns_json)
        VALUES (@tableName, @layerName, @groupName, @columnsJson)
      `);

      res.status(200).json({
        success: true,
        tableName,
        columns: propertyColumns,
        featuresCount: geojson.features.length,
      });
    } catch (error) {
      console.error("Shapefile upload error:", error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    } finally {
      // Clean up temp files
      if (fs.existsSync(shpPath)) fs.unlinkSync(shpPath);
      if (fs.existsSync(dbfPath)) fs.unlinkSync(dbfPath);
    }
  });

  // Add endpoint to get uploaded layers
  router.get("/uploaded-layers", async (req, res) => {
    try {
      const result = await pool.request().query(`
        SELECT * FROM user_layers ORDER BY created_at DESC
      `);
      // console.log(result.recordset);
      res.json(result.recordset);
    } catch (error) {
      console.error("Error fetching uploaded layers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/uploaded-layer/:layerId", async (req, res) => {
    try {
      const { layerId } = req.params;

      // 1. Verify layer exists
      const layerExists = await pool.request().input("layerId", sql.NVarChar(255), layerId).query("SELECT 1 FROM user_layers WHERE table_name = @layerId");

      if (layerExists.recordset.length === 0) {
        return res.status(404).json({ error: "Layer not found" });
      }

      // 2. Get all columns except system columns (id, geom)
      const columnsResult = await pool.request().input("tableName", sql.NVarChar(255), layerId).query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = @tableName
          AND column_name NOT IN ('id', 'geom')
          ORDER BY ordinal_position
        `);

      // 3. Build dynamic SELECT query
      const selectColumns = ["id", "geom.STAsText() AS wkt", ...columnsResult.recordset.map((col) => `[${col.column_name}]`)].join(", ");

      // 4. Execute query
      const dataResult = await pool.request().query(`SELECT ${selectColumns} FROM [${layerId}]`);

      // 5. Convert to GeoJSON
      const features = dataResult.recordset.map((row) => {
        const properties = {};

        // Add all attribute columns to properties
        columnsResult.recordset.forEach((col) => {
          properties[col.column_name] = row[col.column_name];
        });

        return {
          type: "Feature",
          geometry: parseWKT(row.wkt),
          properties: properties,
          id: row.id,
        };
      });

      res.json({
        type: "FeatureCollection",
        features: features,
      });
    } catch (error) {
      console.error(`Error fetching uploaded layer ${req.params.layerId}:`, error);
      res.status(500).json({
        error: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });

  // Fetch editable tables
  router.get("/editables/tables", async (req, res) => {
    const staticTables = ["SurficialSedimentSurvey"]; // static tables (40 Datasets)

    try {
      const uploaded = await pool.request().query("SELECT table_name FROM user_layers");
      const uploadedTables = uploaded.recordset.map((row) => row.table_name);

      res.json({ success: true, tables: [...staticTables, ...uploadedTables] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get("/editables/:tableName", async (req, res) => {
    const { tableName } = req.params;

    try {
      // Exclude 'geom', 'latitude', and 'longitude' etc
      const columnQuery = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
      AND LOWER(COLUMN_NAME) NOT IN ('geom', 'LATITUDE', 'LONGITUDE', '_LAST_UPDA')
    `);

      if (columnQuery.recordset.length === 0) {
        return res.status(404).json({ success: false, error: "No displayable columns found." });
      }

      const columns = columnQuery.recordset.map((col) => `[${col.COLUMN_NAME}]`).join(", ");
      const result = await pool.request().query(`SELECT ${columns} FROM [${tableName}]`);

      res.json({ success: true, data: result.recordset });
    } catch (error) {
      console.error("Error fetching table data:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.put("/editables/:tableName/:id", async (req, res) => {
    const { tableName, id } = req.params;
    const updates = req.body;

    try {
      // Exclude 'id' from the update payload
      const columns = Object.keys(updates).filter((col) => col.toLowerCase() !== "id");

      if (columns.length === 0) {
        return res.status(400).json({ success: false, error: "No valid fields to update." });
      }

      const setClauses = columns.map((col) => `[${col}] = @${col}`).join(", ");

      const request = pool.request();
      columns.forEach((col) => {
        request.input(col, updates[col]);
      });
      request.input("id", id);

      await request.query(`
      UPDATE [${tableName}]
      SET ${setClauses}
      WHERE id = @id
    `);

      res.json({ success: true, message: "Row updated successfully." });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.delete("/editables/:tableName/:id", async (req, res) => {
    const { tableName, id } = req.params;

    try {
      await pool.request().query(`DELETE FROM [${tableName}] WHERE id = ${id}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};

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

module.exports = (pool) => {
  router.post("/shapefiles", async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    try {
      const { tableName, groupName } = req.body;
      const shpFile = req.files.shp;
      const dbfFile = req.files.dbf;

      // Validate required files
      if (!shpFile || !dbfFile) {
        return res.status(400).json({ error: "Both .shp and .dbf files are required" });
      }

      // Save files temporarily
      const uploadDir = path.join(__dirname, "..", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      const shpPath = path.join(uploadDir, shpFile.name);
      const dbfPath = path.join(uploadDir, dbfFile.name);

      await shpFile.mv(shpPath);
      await dbfFile.mv(dbfPath);

      // Parse shapefile
      const geojson = await shapefile.read(shpPath, dbfPath);

      // Clean up temp files
      fs.unlinkSync(shpPath);
      fs.unlinkSync(dbfPath);

      // Analyze properties to determine column types
      let propertyColumns = {};
      if (geojson.features.length > 0) {
        const sampleProps = geojson.features[0].properties || {};
        for (const [key, value] of Object.entries(sampleProps)) {
          const sqlType = determineSqlType(value);
          propertyColumns[key] = sqlType;
        }
      }

      // Create table with dynamic columns
      let createTableQuery = `CREATE TABLE [${tableName}] (
            id INT IDENTITY(1,1) PRIMARY KEY,
            geom GEOGRAPHY`;

      // Add property columns
      for (const [columnName, columnType] of Object.entries(propertyColumns)) {
        createTableQuery += `,\n    ${sanitizeColumnName(columnName)} ${columnType}`;
      }

      createTableQuery += `)`;

      await pool.request().query(createTableQuery);

      // Batch insert features
      const batchSize = 100;
      for (let i = 0; i < geojson.features.length; i += batchSize) {
        const batch = geojson.features.slice(i, i + batchSize);
        let insertQuery = `INSERT INTO [${tableName}] (geom`;

        // Add property columns to query
        const columns = Object.keys(propertyColumns);
        columns.forEach((col) => {
          insertQuery += `, ${sanitizeColumnName(col)}`;
        });

        insertQuery += `) VALUES `;

        // Add values for each feature
        const values = batch
          .map((feature) => {
            const geom = createGeography(feature.geometry);
            const props = feature.properties || {};
            let valueStr = `(${geom}`;

            columns.forEach((col) => {
              const value = props[col];
              valueStr += `, ${formatValueForSql(value, propertyColumns[col])}`;
            });

            return valueStr + `)`;
          })
          .join(", ");

        await pool.request().query(insertQuery + values);
      }

      // Ensure user_layers table exists with correct schema
      await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_layers' AND xtype='U')
            CREATE TABLE user_layers (
                id INT IDENTITY(1,1) PRIMARY KEY,
                table_name NVARCHAR(255) NOT NULL,
                layer_name NVARCHAR(255) NOT NULL,
                group_name NVARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT GETDATE() NOT NULL,
                columns_json NVARCHAR(MAX)
            )
        `);

      // Insert layer metadata
      const columnsJson = JSON.stringify(propertyColumns);
      await pool.request().input("tableName", sql.NVarChar(255), tableName).input("layerName", sql.NVarChar(255), tableName).input("groupName", sql.NVarChar(255), groupName).input("columnsJson", sql.NVarChar(sql.MAX), columnsJson).query(`
                INSERT INTO user_layers 
                (table_name, layer_name, group_name, columns_json)
                VALUES 
                (@tableName, @layerName, @groupName, @columnsJson)
            `);

      res.status(200).json({
        success: true,
        tableName,
        columns: propertyColumns,
        featuresCount: geojson.features.length,
      });
    } catch (error) {
      console.error("Error uploading shapefile:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });

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

  // Keep the same parseWKT helper function from previous examples

  return router;
};

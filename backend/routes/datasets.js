const express = require("express");
const router = express.Router();
const sql = require("mssql");
const shapefile = require("shapefile");
const fs = require("fs");
const path = require("path");

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
    if (geojson.type === "Point") {
      return `geography::Point(${geojson.coordinates[1]}, ${geojson.coordinates[0]}, 4326)`;
    }
    return `geography::STGeomFromText('${JSON.stringify(geojson)}', 4326)`;
  }
  // Add endpoint to get uploaded layers
  router.get("/uploaded-layers", async (req, res) => {
    try {
      const result = await pool.request().query(`
        SELECT * FROM user_layers ORDER BY created_at DESC
      `);
      console.log(result.recordset);
      res.json(result.recordset);
    } catch (error) {
      console.error("Error fetching uploaded layers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sql = require("mssql");

const app = express();
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN, process.env.GEOSERVER_ORIGIN],
    credentials: true,
  })
);

const port = process.env.PORT || 1433;

// MSSQL connection config
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

console.log("Attempting MSSQL connection with config:");

sql
  .connect(dbConfig)
  .then((pool) => {
    if (pool.connected) {
      console.log("Connected to the MSSQL database.");

      try {
        const testRoutes = require("./routes/test")(pool);
        const layerRoutes = require("./routes/getLayers")(pool);
        const geoserverRoutes = require("./routes/geoserverProxy")(pool);

        app.use("/test", testRoutes);
        app.use("/layer", layerRoutes);
        app.use("/api/geoserver", geoserverRoutes);
      } catch (err) {
        console.error("Error setting up routes:", err);
      }

      app.listen(port, () => {
        console.log(`The server is running on port: ${port}.`);
      });
    }
  })
  .catch((err) => {
    console.error("Error connecting to MSSQL:", err);
  });

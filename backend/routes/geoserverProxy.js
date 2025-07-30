const express = require("express");
const router = express.Router();
const axios = require("axios");

const GEOSERVER_URL = process.env.GEOSERVER_BASE;
const GEOSERVER_USER = process.env.GEOSERVER_USER;
const GEOSERVER_PASS = process.env.GEOSERVER_PASS;

module.exports = (db) => {

  // vector proxy
  router.get("/:layer", async (req, res) => {
    const { layer } = req.params;

    // Optional: whitelist allowed layers
    const allowedLayers = {
      nationalRoads: "GMS:hotosm_phl_roads_lines_shp",
      soilType: "GMS:daSoil",
      GeolPhils: "GMS:Geol_Phils_MGB",
      Nipas: "GMS:Nipas_",
      KBA: "GMS:KBA_",
      abraRiver: "GMS:Abra River Basin",
      agnoRiver: "GMS:Agno River Basin",
      agusanRiver: "GMS:Agusan River Basin",
      apayaoRiver: "GMS:Apayao-Abulug River Basin",
      bicolRiver: "GMS:Bicol River Basin",
      buayanRiver: "GMS:Buayan-Malungon River Basin",
      cagayanRiver: "GMS:Cagayan River Basin",
      BirdSanctuary: "GMS:Game_Refuge_and_Bird_Sanctuary",
      NationalPark: "GMS:National_Park",
      ProtectedSea: "GMS:Protected_Seascape",
      WatershedReserve: "GMS:Watershed_Reservation",
    };

    const typeName = allowedLayers[layer];
    if (!typeName) {
      return res.status(400).json({ error: "Invalid layer name" });
    }

    try {
      const response = await axios.get(GEOSERVER_URL, {
        params: {
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName,
          outputFormat: "application/json",
          maxFeatures: 500000,
        },
        auth: {
          username: GEOSERVER_USER,
          password: GEOSERVER_PASS,
        },
      });

      res.json(response.data);
    } catch (err) {
      console.error("GeoServer proxy error:", err.message);
      res.status(500).json({ error: "Failed to fetch layer from GeoServer" });
    }
  });

  // raster proxy
  router.get("/", async (req, res) => {
  try {
    const params = {
      service: "WMS",
      version: "1.1.1",
      request: "GetMap",
      layers: req.query.layer,
      styles: "",
      bbox: req.query.bbox,
      width: req.query.width || "256",
      height: req.query.height || "256",
      srs: req.query.srs || "EPSG:3857",
      format: "image/png",
      transparent: "true",
    };

    const response = await axios.get(GEOSERVER_URL, {
      responseType: "arraybuffer", // So image data is returned correctly
      params,
      auth: {
        username: GEOSERVER_USER,
        password: GEOSERVER_PASS,
      },
    });

    res.set("Content-Type", "image/png");
    res.send(response.data);
  } catch (error) {
    console.error("WMS proxy error:", error.message);
    res.status(500).send("Failed to fetch WMS tile.");
  }
});
  router.get("/test", async (req, res) => {
    console.log(1);
  });

  return router;
};

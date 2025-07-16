const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/getRiverBasin", (req, res) => {
    const sql = `SELECT * FROM major_river_basins`;

    let formattedresult = []
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        
        for (i = 0; i < result.recordset.length; i++) {
          let obj = {
            type: 'Feature',
            properties: {
              objectID: i + 1,
              name: result.recordset[i].name,
            },
            geometry: {
              type: "Polygon",
              coordinates: [result.recordset[i].geom.points.map((point) => [point.x, point.y])]
            }
          }

          formattedresult = formattedresult.concat(obj)

        }
        
        res.json(formattedresult);
      }
    });
  });

  router.get("/getLandCover", (req, res) => {
    const sql = `SELECT TOP 1000 * FROM land_cover_map_r2`;

    let formattedresult = []
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        console.log(result.recordset)
        for (i = 0; i < result.recordset.length; i++) {
          let obj = {
            type: 'Feature',
            properties: {
              objectID: i + 1,
              class_name: result.recordset[i].class_name,
              province: result.recordset[i].province,
            },
            geometry: {
              type: "Polygon",
              coordinates: [result.recordset[i].geom.points.map((point) => [point.x, point.y])]
            }
          }

          formattedresult = formattedresult.concat(obj)

        }
        
        res.json(formattedresult);
      }
    });
  });

  router.get("/getPointsHeat", (req, res) => {
    const sql = `SELECT * FROM forestcoverloss_isabela`;

    let formattedresult = []
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        // console.log(result.recordset)
        for (i = 0; i < result.recordset.length; i++) {
          let obj = {
            type: 'Feature',
            properties: {
              objectID: i + 1,
              pointid: result.recordset[i].pointid,
              grid_code: result.recordset[i].grid_code,
            },
            geometry: {
              type: "Point",
              coordinates: result.recordset[i].geom.points.map((point) => [point.x, point.y])[0]
            }
          }

          formattedresult = formattedresult.concat(obj)

        }
        
        res.json(formattedresult);
      }
    });
  });

  router.get("/getBarangays", (req, res) => {
    const sql = `SELECT * FROM barangays`;
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        res.json(result.recordset);
      }
    });
  });

  router.get("/getRegions", (req, res) => {
    const sql = `SELECT * FROM regions`;
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        res.json(result.recordset);
      }
    });
  });

  router.get("/getRoadNetworks", (req, res) => {
    const sql = `SELECT * from roadnetwork`;

    let formattedresult = []
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        for (i = 0; i < result.recordset.length; i++) {
          let obj = {
            type: 'Feature',
            properties: {
              objectID: i + 1,
              osm_id: result.recordset[i].osm_id
            },
            geometry: {
              type: "LineString",
              coordinates: result.recordset[i].geom.points.map((point) => [point.x, point.y])
            }
          }

          formattedresult = formattedresult.concat(obj)

        }
        
        res.json(formattedresult);
      }
    })
  })


  return router;
};

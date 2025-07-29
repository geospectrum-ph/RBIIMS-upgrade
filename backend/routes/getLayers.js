const express = require("express");
const router = express.Router();
const sql = require("mssql");

module.exports = (db) => {
  router.get("/getRiverBasin", (req, res) => {
    const sql = `SELECT * FROM major_river_basins`;

    let formattedresult = [];
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        for (i = 0; i < result.recordset.length; i++) {
          let obj = {
            type: "Feature",
            properties: {
              objectID: i + 1,
              name: result.recordset[i].name,
            },
            geometry: {
              type: "Polygon",
              coordinates: [result.recordset[i].geom.points.map((point) => [point.x, point.y])],
            },
          };

          formattedresult = formattedresult.concat(obj);
        }

        res.json(formattedresult);
      }
    });
  });

  router.get("/getLandCover", (req, res) => {
    const sql = `SELECT TOP 1000 * FROM land_cover_map_r2`;

    let formattedresult = [];
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        console.log(result.recordset);
        for (i = 0; i < result.recordset.length; i++) {
          let obj = {
            type: "Feature",
            properties: {
              objectID: i + 1,
              class_name: result.recordset[i].class_name,
              province: result.recordset[i].province,
            },
            geometry: {
              type: "Polygon",
              coordinates: [result.recordset[i].geom.points.map((point) => [point.x, point.y])],
            },
          };

          formattedresult = formattedresult.concat(obj);
        }

        res.json(formattedresult);
      }
    });
  });

  // router.get("/getPointsHeat", (req, res) => {
  //   const sql = `SELECT * FROM forestcoverloss_isabela`;
  //   let formattedresult = [];
  //   db.query(sql, (err, result) => {
  //     if (err) {
  //       console.error(err);
  //       res.status(500).json({ message: "Server error" });
  //     } else {
  //       // console.log(result.recordset)
  //       for (i = 0; i < result.recordset.length; i++) {
  //         let obj = {
  //           type: "Feature",
  //           properties: {
  //             objectID: i + 1,
  //             pointid: result.recordset[i].pointid,
  //             grid_code: result.recordset[i].grid_code,
  //           },
  //           geometry: {
  //             type: "Point",
  //             coordinates: result.recordset[i].geom.points.map((point) => [point.x, point.y])[0],
  //           },
  //         };

  //         formattedresult = formattedresult.concat(obj);
  //       }

  //       res.json(formattedresult);
  //     }
  //   });
  // });

  // Forest Cover Loss
  router.get("/getPointsHeat", (req, res) => {
    const { regn, year } = req.query;

    const tableMap = {
      CAR: "forestcoverloss_car",
      BARMM: "forestcoverloss_barmm",
      MIMAROPA: "forestcoverloss_mimaropa",
      NCR: "forestcoverloss_ncr",
      NIR: "forestcoverloss_nir",
      R1: "forestcoverloss_r1",
      R2: "forestcoverloss_r2",
      R3: "forestcoverloss_r3",
      R4A: "forestcoverloss_r4a",
      R5: "forestcoverloss_r5",
      R6: "forestcoverloss_r6",
      R7: "forestcoverloss_r7",
      R8: "forestcoverloss_r2",
      R9: "forestcoverloss_r3",
      R10: "forestcoverloss_r1",
      R11: "forestcoverloss_r2",
      R12: "forestcoverloss_r3",
      R13: "forestcoverloss_r3",
      // other regions
    };

    const table = tableMap[regn];

    if (!table) {
      return res.status(400).json({ message: "Invalid region code." });
    }

    if (!year || isNaN(year)) {
      return res.status(400).json({ message: "Invalid or missing year." }); //
    }

    // Extract the last 1 or 2 digits of the year
    const yearStr = year.toString();
    const shortYear = parseInt(yearStr.slice(-2), 10); // '2001' -> 1, '2022' -> 22

    const request = new sql.Request(req.pool);

    const query = `SELECT * FROM ${table} WHERE grid_code = @year`;

    request.input("year", sql.Int, shortYear);

    request.query(query, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Server error." });
      }

      const formattedResult = result.recordset.map((row, index) => ({
        type: "Feature",
        properties: {
          objectID: index + 1,
          pointid: row.pointid,
          grid_code: row.grid_code,
          mag: row.mag || 1,
        },
        geometry: {
          type: "Point",
          coordinates: row.geom?.points?.[0] ? [row.geom.points[0].x, row.geom.points[0].y] : [0, 0],
        },
      }));

      res.json(formattedResult);
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

    let formattedresult = [];
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        for (i = 0; i < result.recordset.length; i++) {
          let obj = {
            type: "Feature",
            properties: {
              objectID: i + 1,
              osm_id: result.recordset[i].osm_id,
            },
            geometry: {
              type: "LineString",
              coordinates: result.recordset[i].geom.points.map((point) => [point.x, point.y]),
            },
          };

          formattedresult = formattedresult.concat(obj);
        }

        res.json(formattedresult);
      }
    });
  });

  router.get("/getNatRoad", (req, res) => {
    const sql = `SELECT * from hotosm_phl_roads_lines_shp`;

    let formattedresult = [];
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        for (i = 0; i < result.recordset.length; i++) {
          let obj = {
            type: "Feature",
            properties: {
              objectID: i + 1,
              osm_id: result.recordset[i].osm_id,
            },
            geometry: {
              type: "LineString",
              coordinates: result.recordset[i].geom.points.map((point) => [point.x, point.y]),
            },
          };

          formattedresult = formattedresult.concat(obj);
        }

        res.json(formattedresult);
      }
    });
  });

  return router;
};

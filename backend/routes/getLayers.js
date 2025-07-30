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
      R8: "forestcoverloss_r8",
      R9: "forestcoverloss_r9",
      R10: "forestcoverloss_r10",
      R11: "forestcoverloss_r11",
      R12: "forestcoverloss_r12",
      R13: "forestcoverloss_r13",
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

  router.get("/getPopulationData", (req, res) => {
    const { type, region } = req.query;

    const colMap = {
      POP_MAY202: "POP_MAY202",
      PopDensity: "PopDensity",
    };

    const column = colMap[type];
    const regionMap = {
      "REGION I (ILOCOS REGION)": "PH010000000",
      "REGION II (CAGAYAN VALLEY)": "PH020000000",
      "REGION III (CENTRAL LUZON)": "PH030000000", 
      "REGION IV-A (CALABARZON)": "PH040000000", 
      "REGION IV-B (MIMAROPA)": "PH170000000", 
      "REGION V (BICOL REGION)": "PH050000000", 
      "REGION VI (WESTERN VISAYAS)": "PH060000000",
      "REGION VII (CENTRAL VISAYAS)": "PH070000000",
      "REGION VIII (EASTERN VISAYAS)": "PH080000000",
      "REGION IX (ZAMBOANGA PENINSULA)": "PH090000000",
      "REGION X (NORTHERN MINDANAO)": "PH100000000",
      "REGION XI (DAVAO REGION)": "PH110000000",
      "REGION XII (SOCCSKSARGEN)": "PH120000000", 
      "NATIONAL CAPITAL REGION (NCR)": "PH130000000", 
      "CORDILLERA ADMINISTRATIVE REGION (CAR)": "PH140000000", 
      "AUTONOMOUS REGION IN MUSLIM MINDANAO (ARMM)": "PH150000000",
      "REGION XIII (Caraga)": "PH160000000",
      "Negros Island Region": "PH180000000",
      // Add more mappings as needed
    };

    const regionId = regionMap[region];
    if (!column || !regionId) {
      return res.status(400).json({ message: "Invalid parameters." });
    }

    const query = `
    SELECT Reg_Name, Mun_Name, qgs_fid, Mun_Code, ${column} as value, geom 
    FROM PSANAMRIA_munibdry_pop2020 
    WHERE Reg_Code = @regionId
  `;

    const request = new sql.Request();
    request.input("regionId", sql.VarChar, regionId);

    request.query(query, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Server error." });
      }

      const convertToGeoJSONPolygon = (geometry) => {
        if (!geometry || !geometry.points || geometry.points.length === 0) return null;

        const coordinates = geometry.points.map((pt) => [pt.x, pt.y]);

        // Close ring if necessary
        if (coordinates.length > 2 && (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
          coordinates.push(coordinates[0]);
        }

        return {
          type: "Polygon",
          coordinates: [coordinates],
        };
      };

      const features = result.recordset.map((row) => ({
        type: "Feature",
        properties: {
          _uid: row.qgs_fid,
          region: row.Reg_Name,
          municipality: row.Mun_Name,
          municipality_code: row.Mun_Code,
          population: type === "POP_MAY202" ? Number(row.value) : null,
          density: type === "PopDensity" ? Number(row.value) : null,
        },
        geometry: convertToGeoJSONPolygon(row.geom),
      }));
      // console.log(features)
      res.json(features);
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

const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/getTest", (req, res) => {
    const sql = `SELECT * FROM majorriverbasin_gj`;
    db.query(sql, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      } else {
        res.json(result.recordset);
      }
    });
  });

  return router;
};

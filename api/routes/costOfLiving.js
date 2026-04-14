const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cost_of_living ORDER BY city");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:city", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM cost_of_living WHERE city = $1",
      [req.params.city]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "City not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

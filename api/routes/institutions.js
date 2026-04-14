const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM institutions ORDER BY key");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:key", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM institutions WHERE key = $1",
      [req.params.key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Institution not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

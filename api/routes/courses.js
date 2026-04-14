const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { domain, level, country, free, online } = req.query;
    let query = "SELECT * FROM courses WHERE 1=1";
    const params = [];
    let idx = 1;

    if (domain) {
      query += ` AND domain = $${idx++}`;
      params.push(domain);
    }
    if (level) {
      query += ` AND level = $${idx++}`;
      params.push(level);
    }
    if (country) {
      query += ` AND country = $${idx++}`;
      params.push(country);
    }
    if (free === "true") {
      query += " AND is_free = true";
    }
    if (online === "true") {
      query += " AND is_online = true";
    }

    query += " ORDER BY id";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, i.full_name, i.type as inst_type, i.founded, i.students,
              i.url as inst_url, i.apply_url, i.contact_email, i.latitude, i.longitude, i.description as inst_desc,
              col.rent, col.food, col.transport, col.utilities, col.misc, col.currency, col.note as col_note
       FROM courses c
       LEFT JOIN institutions i ON c.institution_key = i.key
       LEFT JOIN cost_of_living col ON c.city = col.city
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

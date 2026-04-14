const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const pool = require("../db/pool");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();
router.use(adminAuth);

// ─── Scrape Sources ──────────────────────────────────────────────────────────

router.get("/sources", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM scrape_sources ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/sources/:id", async (req, res) => {
  try {
    const { is_active } = req.body;
    const result = await pool.query(
      "UPDATE scrape_sources SET is_active = $1 WHERE id = $2 RETURNING *",
      [is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Scrape Trigger & Status ─────────────────────────────────────────────────

router.post("/scrape/trigger", async (req, res) => {
  const { source } = req.body;
  if (!source) return res.status(400).json({ error: "source required" });

  try {
    // Create a scrape run record
    const sourceRow = await pool.query(
      "SELECT id FROM scrape_sources WHERE name = $1",
      [source]
    );
    if (!sourceRow.rows.length)
      return res.status(404).json({ error: `Source '${source}' not found` });

    const run = await pool.query(
      "INSERT INTO scrape_runs (source_id, status) VALUES ($1, 'running') RETURNING id",
      [sourceRow.rows[0].id]
    );
    const runId = run.rows[0].id;

    // Spawn scraper as child process
    const scraperPath = path.join(__dirname, "../../scrapers/index.js");
    const child = spawn("node", [scraperPath, "--source", source, "--run-id", String(runId)], {
      cwd: path.join(__dirname, "../../scrapers"),
      stdio: "pipe",
      detached: false,
    });

    let output = "";
    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));

    child.on("close", async (code) => {
      const status = code === 0 ? "success" : "failed";
      await pool.query(
        "UPDATE scrape_runs SET status = $1, completed_at = NOW(), error_log = $2 WHERE id = $3",
        [status, code !== 0 ? output : null, runId]
      );
      await pool.query(
        "UPDATE scrape_sources SET last_run_at = NOW(), last_run_status = $1 WHERE id = $2",
        [status, sourceRow.rows[0].id]
      );
    });

    res.json({ runId, status: "running", message: `Scraper started for ${source}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/scrape/status/:runId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*, ss.name as source_name
       FROM scrape_runs sr
       JOIN scrape_sources ss ON sr.source_id = ss.id
       WHERE sr.id = $1`,
      [req.params.runId]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Run not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Scrape Import (raw JSON → staging_courses) ─────────────────────────────

router.post("/scrape/import/:runId", async (req, res) => {
  try {
    const run = await pool.query(
      `SELECT sr.*, ss.name as source_name, ss.id as src_id
       FROM scrape_runs sr JOIN scrape_sources ss ON sr.source_id = ss.id
       WHERE sr.id = $1`,
      [req.params.runId]
    );
    if (!run.rows.length)
      return res.status(404).json({ error: "Run not found" });

    const { source_name, src_id } = run.rows[0];
    const timestamp = new Date().toISOString().slice(0, 10);
    const outputFile = path.join(
      __dirname, "../../scrapers/output",
      `${source_name}-${timestamp}-raw.json`
    );

    if (!fs.existsSync(outputFile)) {
      return res.status(404).json({ error: `Output file not found: ${outputFile}` });
    }

    const courses = JSON.parse(fs.readFileSync(outputFile, "utf8"));
    let imported = 0;
    let duplicates = 0;

    for (const c of courses) {
      // Check for duplicates via fingerprint
      const existing = await pool.query(
        "SELECT course_id FROM course_dedup_index WHERE fingerprint = $1",
        [c.fingerprint]
      );
      const duplicateOf = existing.rows.length ? existing.rows[0].course_id : null;

      await pool.query(
        `INSERT INTO staging_courses
         (source_id, scrape_run_id, source_url, source_course_id,
          title, institution_key, country, city, level, mode, domain, subjects,
          fee_home, fee_intl, fee_scotland, living_cost, duration, ranking,
          entry_reqs, career_paths, avg_salary, employability, is_online, is_free,
          confidence_score, auto_classified_domain, data_quality_score,
          status, duplicate_of, raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)`,
        [
          src_id, req.params.runId, c.sourceUrl, c.sourceCourseId,
          c.title, c.institution, c.country, c.city, c.level, c.mode, c.domain, c.subjects,
          c.feeHome, c.feeIntl, c.feeScotland, c.livingCost, c.duration, c.ranking,
          c.entryReqs, c.careerPaths || [], c.avgSalary, c.employability, c.online, c.free,
          c.confidence_score, c.domain, c.data_quality_score,
          duplicateOf ? "merged" : "pending", duplicateOf,
          JSON.stringify(c),
        ]
      );
      if (duplicateOf) duplicates++;
      else imported++;
    }

    // Update run counts
    await pool.query(
      `UPDATE scrape_runs SET courses_found = $1, courses_new = $2, courses_updated = $3 WHERE id = $4`,
      [courses.length, imported, duplicates, req.params.runId]
    );
    await pool.query(
      "UPDATE scrape_sources SET last_run_count = $1 WHERE id = $2",
      [courses.length, src_id]
    );

    res.json({ imported, duplicates, total: courses.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Staging Review ──────────────────────────────────────────────────────────

router.get("/staging", async (req, res) => {
  try {
    const { status = "pending", source, domain, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = "SELECT sc.*, ss.display_name as source_name FROM staging_courses sc LEFT JOIN scrape_sources ss ON sc.source_id = ss.id WHERE 1=1";
    const params = [];
    let idx = 1;

    if (status) { query += ` AND sc.status = $${idx++}`; params.push(status); }
    if (source) { query += ` AND ss.name = $${idx++}`; params.push(source); }
    if (domain) { query += ` AND sc.domain = $${idx++}`; params.push(domain); }

    // Count total
    const countResult = await pool.query(
      query.replace("SELECT sc.*, ss.display_name as source_name", "SELECT COUNT(*)"),
      params
    );

    query += ` ORDER BY sc.confidence_score DESC, sc.data_quality_score DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({
      courses: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/staging/:id/approve", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const staging = await client.query(
      "SELECT * FROM staging_courses WHERE id = $1 AND status = 'pending'",
      [req.params.id]
    );
    if (!staging.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Staging course not found or not pending" });
    }
    const sc = staging.rows[0];

    // Get next course ID
    const maxId = await client.query("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM courses");
    const newId = maxId.rows[0].next_id;

    // Insert into live courses
    await client.query(
      `INSERT INTO courses
       (id, title, institution_key, country, city, level, mode, domain, subjects,
        fee_home, fee_intl, fee_scotland, living_cost, duration, ranking,
        entry_reqs, career_paths, avg_salary, employability, is_online, is_free,
        source_id, source_url, source_course_id, data_quality_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [
        newId, sc.title, sc.institution_key, sc.country, sc.city, sc.level,
        sc.mode, sc.domain, sc.subjects, sc.fee_home, sc.fee_intl, sc.fee_scotland,
        sc.living_cost, sc.duration, sc.ranking, sc.entry_reqs, sc.career_paths,
        sc.avg_salary, sc.employability, sc.is_online, sc.is_free,
        sc.source_id, sc.source_url, sc.source_course_id, sc.data_quality_score,
      ]
    );

    // Register fingerprint
    const crypto = require("crypto");
    const fp = crypto.createHash("sha256").update(
      `${sc.title?.toLowerCase()}|${sc.institution_key?.toLowerCase()}|${sc.level}|${sc.country?.toLowerCase()}`
    ).digest("hex");
    await client.query(
      "INSERT INTO course_dedup_index (course_id, fingerprint, title_norm) VALUES ($1, $2, $3) ON CONFLICT (fingerprint) DO NOTHING",
      [newId, fp, sc.title?.toLowerCase()]
    );

    // Update staging status
    await client.query(
      "UPDATE staging_courses SET status = 'approved', reviewed_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    await client.query("COMMIT");
    res.json({ courseId: newId, status: "approved" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put("/staging/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    await pool.query(
      "UPDATE staging_courses SET status = 'rejected', rejection_reason = $1, reviewed_at = NOW() WHERE id = $2",
      [reason || "No reason given", req.params.id]
    );
    res.json({ status: "rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/staging/bulk-approve", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length)
    return res.status(400).json({ error: "ids array required" });

  let approved = 0;
  for (const id of ids) {
    try {
      // Reuse single approve logic
      const fakeRes = {
        json: () => approved++,
        status: () => ({ json: () => {} }),
      };
      await router.handle(
        { params: { id }, method: "PUT", url: `/${id}/approve` },
        fakeRes,
        () => {}
      );
    } catch (e) { /* skip failures */ }
  }
  // Simpler approach: direct query
  const result = await pool.query(
    "UPDATE staging_courses SET status = 'approved', reviewed_at = NOW() WHERE id = ANY($1) AND status = 'pending' RETURNING id",
    [ids]
  );
  res.json({ approved: result.rowCount });
});

router.post("/staging/bulk-reject", async (req, res) => {
  const { ids, reason } = req.body;
  if (!Array.isArray(ids))
    return res.status(400).json({ error: "ids array required" });

  const result = await pool.query(
    "UPDATE staging_courses SET status = 'rejected', rejection_reason = $1, reviewed_at = NOW() WHERE id = ANY($2) AND status = 'pending' RETURNING id",
    [reason || "Bulk rejected", ids]
  );
  res.json({ rejected: result.rowCount });
});

// ─── Cost of Living ──────────────────────────────────────────────────────────

router.get("/cities/missing-col", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT c.city, c.country
       FROM courses c
       LEFT JOIN cost_of_living col ON c.city = col.city
       WHERE col.id IS NULL AND c.city != 'Online'
       ORDER BY c.city`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/col", async (req, res) => {
  try {
    const { city, rent, food, transport, utilities, misc, currency, note, country, source } = req.body;
    const result = await pool.query(
      `INSERT INTO cost_of_living (city, rent, food, transport, utilities, misc, currency, note, country, source, last_scraped_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (city) DO UPDATE SET
         rent=$2, food=$3, transport=$4, utilities=$5, misc=$6, currency=$7, note=$8,
         country=$9, source=$10, last_scraped_at=NOW(), updated_at=NOW()
       RETURNING *`,
      [city, rent, food, transport, utilities, misc, currency, note, country || null, source || "manual"]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Exports & Stats ─────────────────────────────────────────────────────────

router.get("/export/courses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/export/institutions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM institutions ORDER BY key");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [courses, institutions, col, pending, sources] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM courses"),
      pool.query("SELECT COUNT(*) FROM institutions"),
      pool.query("SELECT COUNT(*) FROM cost_of_living"),
      pool.query("SELECT COUNT(*) FROM staging_courses WHERE status = 'pending'"),
      pool.query("SELECT * FROM scrape_sources ORDER BY name"),
    ]);

    res.json({
      totalCourses: parseInt(courses.rows[0].count),
      totalInstitutions: parseInt(institutions.rows[0].count),
      totalCities: parseInt(col.rows[0].count),
      pendingReview: parseInt(pending.rows[0].count),
      sources: sources.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/scrape/report/latest", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*, ss.name as source_name, ss.display_name
       FROM scrape_runs sr
       JOIN scrape_sources ss ON sr.source_id = ss.id
       ORDER BY sr.started_at DESC LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

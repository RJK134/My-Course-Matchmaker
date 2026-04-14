const fs = require("fs");
const path = require("path");
const pool = require("./pool");

const DATA_DIR = path.join(__dirname, "../../frontend/src/data");

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await client.query(schema);
    console.log("Schema created.");

    // Seed institutions
    const institutions = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "institutions.json"), "utf8")
    );
    for (const i of institutions) {
      await client.query(
        `INSERT INTO institutions (key, full_name, type, founded, students, url, apply_url, contact_email, latitude, longitude, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (key) DO NOTHING`,
        [i.key, i.full, i.type, i.founded, i.students, i.url, i.apply, i.contact, i.lat, i.lng, i.desc]
      );
    }
    console.log(`Seeded ${institutions.length} institutions.`);

    // Seed courses
    const courses = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "courses.json"), "utf8")
    );
    for (const c of courses) {
      await client.query(
        `INSERT INTO courses (id, title, institution_key, country, city, level, mode, domain, subjects, fee_home, fee_intl, fee_scotland, living_cost, duration, ranking, entry_reqs, career_paths, avg_salary, employability, is_online, is_free)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         ON CONFLICT (id) DO NOTHING`,
        [
          c.id, c.title, c.institution, c.country, c.city, c.level,
          c.mode, c.domain, c.subjects,
          c.feeHome, c.feeIntl, c.feeScotland || null, c.livingCost,
          c.duration, c.ranking, c.entryReqs, c.careerPaths,
          c.avgSalary, c.employability, c.online, c.free,
        ]
      );
    }
    console.log(`Seeded ${courses.length} courses.`);

    // Seed cost of living
    const col = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "costOfLiving.json"), "utf8")
    );
    for (const c of col) {
      await client.query(
        `INSERT INTO cost_of_living (city, rent, food, transport, utilities, misc, currency, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (city) DO NOTHING`,
        [c.city, c.rent, c.food, c.transport, c.utils, c.misc, c.currency, c.note]
      );
    }
    console.log(`Seeded ${col.length} cities.`);

    // Seed domain families
    const domains = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "domainFamilies.json"), "utf8")
    );
    for (const [key, keywords] of Object.entries(domains.domainFamilies)) {
      const label = domains.domainLabels[key] || key;
      await client.query(
        `INSERT INTO domain_families (domain_key, display_label, keywords)
         VALUES ($1,$2,$3)
         ON CONFLICT (domain_key) DO NOTHING`,
        [key, label, keywords]
      );
    }
    console.log(`Seeded ${Object.keys(domains.domainFamilies).length} domain families.`);

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

require("dotenv").config({ path: "../api/.env" });

module.exports = {
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || "coursematchmaker",
    user: process.env.DB_USER || "mcm",
    password: process.env.DB_PASSWORD || "changeme",
  },
  sources: {
    ucas: {
      baseUrl: "https://digital.ucas.com/coursedisplay",
      rateLimit: 2000, // ms between requests
      maxPages: 500,
      userAgent: "MyCourseMatchmaker/1.0 (Educational Research)",
    },
    studyportals: {
      baseUrl: "https://www.bachelorsportal.com",
      mastersUrl: "https://www.mastersportal.com",
      rateLimit: 2000,
      maxPages: 400,
      userAgent: "MyCourseMatchmaker/1.0 (Educational Research)",
    },
    qs_the: {
      qsUrl: "https://www.topuniversities.com/programs",
      theUrl: "https://www.timeshighereducation.com/world-university-rankings",
      rateLimit: 3000,
      maxPages: 200,
      userAgent: "MyCourseMatchmaker/1.0 (Educational Research)",
    },
    mooc: {
      courseraApi: "https://api.coursera.org/api/courses.v1",
      edxUrl: "https://www.edx.org/search",
      futureLearnUrl: "https://www.futurelearn.com/courses",
      rateLimit: 1500,
      userAgent: "MyCourseMatchmaker/1.0 (Educational Research)",
    },
    numbeo: {
      baseUrl: "https://www.numbeo.com/cost-of-living/in",
      rateLimit: 3000,
      userAgent: "MyCourseMatchmaker/1.0 (Educational Research)",
    },
  },
  outputDir: __dirname + "/output",
};

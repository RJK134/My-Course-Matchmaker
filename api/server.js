const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const coursesRouter = require("./routes/courses");
const institutionsRouter = require("./routes/institutions");
const costOfLivingRouter = require("./routes/costOfLiving");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/courses", coursesRouter);
app.use("/api/institutions", institutionsRouter);
app.use("/api/col", costOfLivingRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.listen(PORT, () => {
  console.log(`MyCourseMatchmaker API running on port ${PORT}`);
});

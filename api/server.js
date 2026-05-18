const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const coursesRouter = require("./routes/courses");
const institutionsRouter = require("./routes/institutions");
const costOfLivingRouter = require("./routes/costOfLiving");
const adminRouter = require("./routes/admin");
const careersRouter = require("./routes/careers");
const searchRouter = require("./routes/search");
const insightsRouter = require("./routes/insights");
const fundingRouter = require("./routes/funding");
const { router: fxRouter } = require("./routes/fx");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/courses", coursesRouter);
app.use("/api/institutions", institutionsRouter);
app.use("/api/col", costOfLivingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/careers", careersRouter);
app.use("/api/search", searchRouter);
app.use("/api/insights", insightsRouter);
app.use("/api/funding", fundingRouter);
app.use("/api/fx", fxRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.listen(PORT, () => {
  console.log(`MyCourseMatchmaker API running on port ${PORT}`);
});

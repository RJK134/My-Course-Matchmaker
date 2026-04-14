#!/usr/bin/env node
/**
 * MyCourseMatchmaker Scraper CLI
 * Usage: node index.js --source mooc [--run-id 42]
 */
const fs = require("fs");
const path = require("path");
const config = require("./config");
const logger = require("./lib/logger");

const SOURCES = {
  mooc: () => require("./sources/mooc"),
  ucas: () => require("./sources/ucas"),
  studyportals: () => require("./sources/studyportals"),
  qs_the: () => require("./sources/qs-the"),
  numbeo: () => require("./sources/numbeo"),
};

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source" && args[i + 1]) parsed.source = args[++i];
    if (args[i] === "--run-id" && args[i + 1]) parsed.runId = args[++i];
    if (args[i] === "--limit" && args[i + 1]) parsed.limit = parseInt(args[++i]);
  }
  return parsed;
}

async function main() {
  const args = parseArgs();

  if (!args.source || !SOURCES[args.source]) {
    console.error(`Usage: node index.js --source <${Object.keys(SOURCES).join("|")}> [--run-id N] [--limit N]`);
    process.exit(1);
  }

  logger.info("cli", `Starting scrape for source: ${args.source}`, { runId: args.runId });

  try {
    const scraper = SOURCES[args.source]();
    const results = await scraper.run({ limit: args.limit || null });

    // Write output
    const timestamp = new Date().toISOString().slice(0, 10);
    const outputFile = path.join(config.outputDir, `${args.source}-${timestamp}-raw.json`);
    fs.mkdirSync(config.outputDir, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

    logger.info("cli", `Scrape complete`, {
      source: args.source,
      coursesFound: results.length,
      outputFile,
    });

    // Write summary for the API to read
    const summaryFile = path.join(config.outputDir, `${args.source}-${timestamp}-summary.json`);
    fs.writeFileSync(summaryFile, JSON.stringify({
      source: args.source,
      runId: args.runId,
      coursesFound: results.length,
      outputFile,
      completedAt: new Date().toISOString(),
      status: "success",
    }));

    process.exit(0);
  } catch (err) {
    logger.error("cli", `Scrape failed: ${err.message}`, { stack: err.stack });

    const timestamp = new Date().toISOString().slice(0, 10);
    const summaryFile = path.join(config.outputDir, `${args.source}-${timestamp}-summary.json`);
    fs.mkdirSync(config.outputDir, { recursive: true });
    fs.writeFileSync(summaryFile, JSON.stringify({
      source: args.source,
      runId: args.runId,
      coursesFound: 0,
      error: err.message,
      completedAt: new Date().toISOString(),
      status: "failed",
    }));

    process.exit(1);
  }
}

main();

const { MeiliSearch } = require("meilisearch");

const COURSES_INDEX = "courses";

let _client = null;

function getMeiliClient() {
  if (_client) return _client;
  const host = process.env.MEILI_HOST || "http://localhost:7700";
  const apiKey = process.env.MEILI_KEY || undefined;
  _client = new MeiliSearch({ host, apiKey });
  return _client;
}

function getCoursesIndex() {
  return getMeiliClient().index(COURSES_INDEX);
}

module.exports = {
  getMeiliClient,
  getCoursesIndex,
  COURSES_INDEX,
};

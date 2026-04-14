function timestamp() {
  return new Date().toISOString();
}

function log(level, source, message, data = {}) {
  const entry = { timestamp: timestamp(), level, source, message, ...data };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
  return entry;
}

module.exports = {
  info: (source, msg, data) => log("info", source, msg, data),
  warn: (source, msg, data) => log("warn", source, msg, data),
  error: (source, msg, data) => log("error", source, msg, data),
  debug: (source, msg, data) => log("debug", source, msg, data),
};

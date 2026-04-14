/**
 * Simple API key authentication for admin routes.
 * Key checked from ADMIN_API_KEY environment variable.
 */
function adminAuth(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    // No key configured = development mode, allow all
    return next();
  }

  const provided =
    req.headers["x-admin-key"] ||
    req.headers.authorization?.replace("Bearer ", "") ||
    req.query.admin_key;

  if (!provided || provided !== key) {
    return res.status(401).json({ error: "Unauthorised. Valid admin key required." });
  }

  next();
}

module.exports = adminAuth;

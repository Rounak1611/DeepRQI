const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

// requireRole must run after requireAuth (needs req.user already set).
// Milestone 10: the dashboard/prioritization view is admin-facing per the
// original spec -- inspectors get field upload + road history, not the
// aggregate view.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Missing or malformed Authorization header." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to access this resource." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };

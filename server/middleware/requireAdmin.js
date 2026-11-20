function requireAdmin(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match || !req.app.locals.adminTokens.has(match[1])) {
    return res
      .status(401)
      .json({ error: "Требуется действительный Bearer-токен" });
  }
  return next();
}

module.exports = requireAdmin;

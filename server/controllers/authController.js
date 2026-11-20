const crypto = require("node:crypto");

function login(req, res) {
  const { login: submittedLogin, password } = req.body || {};
  if (typeof submittedLogin !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Укажите логин и пароль" });
  }

  if (
    submittedLogin !== req.app.locals.adminLogin ||
    password !== req.app.locals.adminPassword
  ) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  req.app.locals.adminTokens.add(token);
  return res.json({ token });
}

module.exports = { login };

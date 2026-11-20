const cors = require("cors");
const express = require("express");
const adminRouter = require("./routers/adminRouter");
const apiRouter = require("./routers/apiRouter");
const authRouter = require("./routers/authRouter");

const app = express();
app.locals.adminTokens = new Set();

app.use(cors());
app.use(express.json({ limit: "32kb" }));
app.use("/api", apiRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => res.status(404).json({ error: "Маршрут не найден" }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && Object.hasOwn(error, "body")) {
    return res.status(400).json({ error: "Некорректный JSON" });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error("Ошибка API:", error);
  return res.status(status).json({
    error: status === 500 ? "Внутренняя ошибка сервера" : error.message,
  });
});

module.exports = app;

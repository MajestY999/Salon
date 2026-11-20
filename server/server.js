require("dotenv").config({
  path: require("node:path").join(__dirname, ".env"),
});

const path = require("node:path");

const DEFAULT_PORT = 5001;
const DEFAULT_ADMIN_LOGIN = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_DB_PATH = path.join(__dirname, "database.sqlite");

const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || DEFAULT_ADMIN_LOGIN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, process.env.DB_PATH)
  : DEFAULT_DB_PATH;

process.env.DB_PATH = DB_PATH;

const app = require("./app");
const { sequelize } = require("./storage/database");
const { seedDatabase } = require("./storage/seed");

app.locals.adminLogin = ADMIN_LOGIN;
app.locals.adminPassword = ADMIN_PASSWORD;

async function startServer() {
  await sequelize.authenticate();
  await sequelize.sync();
  await seedDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Salon demo API listening on http://localhost:${PORT}`);
    console.log(`SQLite database: ${DB_PATH}`);
  });

  function shutdown() {
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Не удалось запустить API:", error);
  process.exitCode = 1;
});

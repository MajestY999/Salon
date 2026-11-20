const path = require("node:path");
const { Sequelize } = require("sequelize");

const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, "..", process.env.DB_PATH)
  : path.join(__dirname, "..", "database.sqlite");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: DB_PATH,
  logging: false,
});

module.exports = { sequelize, DB_PATH };

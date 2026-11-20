const { DataTypes } = require("sequelize");
const { sequelize } = require("./database");

const Services = sequelize.define(
  "services",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
  },
  { tableName: "services", timestamps: false },
);

const Masters = sequelize.define(
  "masters",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    specialty: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "masters", timestamps: false },
);

const Appointments = sequelize.define(
  "appointments",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    barberId: { type: DataTypes.INTEGER, allowNull: false },
    serviceId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    dateStr: { type: DataTypes.STRING, allowNull: false },
    timeStr: { type: DataTypes.STRING, allowNull: false },
    totalPrice: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Pending",
      validate: { isIn: [["Pending", "Confirmed", "Cancelled"]] },
    },
    note: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { tableName: "appointments", timestamps: false },
);

Masters.hasMany(Appointments, { foreignKey: "barberId", onDelete: "RESTRICT" });
Appointments.belongsTo(Masters, { as: "barber", foreignKey: "barberId" });
Services.hasMany(Appointments, {
  foreignKey: "serviceId",
  onDelete: "RESTRICT",
});
Appointments.belongsTo(Services, { as: "service", foreignKey: "serviceId" });

module.exports = { Services, Masters, Appointments };

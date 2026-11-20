const { Op, Transaction } = require("sequelize");
const { sequelize } = require("../storage/database");
const { Appointments, Masters, Services } = require("../storage/models");
const HttpError = require("../utils/HttpError");

const STATUS_VALUES = new Set(["Pending", "Confirmed", "Cancelled"]);

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(date) {
  return date.toLocaleDateString("ru-RU");
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function appointmentIncludes() {
  return [
    {
      model: Masters,
      as: "barber",
      attributes: ["name", "role", "specialty"],
    },
    {
      model: Services,
      as: "service",
      attributes: ["name", "duration"],
    },
  ];
}

function serializeAppointment(appointment) {
  const row = appointment.get({ plain: true });
  const { barber, service, ...fields } = row;
  return {
    ...fields,
    barberName: barber.name,
    barberRole: barber.role,
    specialty: barber.specialty,
    serviceName: service.name,
    duration: service.duration,
  };
}

async function getServices(req, res) {
  const services = await Services.findAll({
    attributes: ["id", "name", "price", "duration"],
    order: [["id", "ASC"]],
  });
  return res.json(services);
}

function validateServiceInput(input, partial = false) {
  const service = {};
  if (!partial || Object.hasOwn(input, "name")) {
    if (typeof input.name !== "string" || !input.name.trim()) {
      throw new HttpError(400, "Укажите название услуги");
    }
    service.name = input.name.trim();
  }
  if (!partial || Object.hasOwn(input, "price")) {
    const price = Number(input.price);
    if (!Number.isSafeInteger(price) || price < 0) {
      throw new HttpError(400, "Цена должна быть целым числом не меньше нуля");
    }
    service.price = price;
  }
  if (!partial || Object.hasOwn(input, "duration")) {
    const duration = Number(input.duration);
    if (!Number.isSafeInteger(duration) || duration < 1) {
      throw new HttpError(
        400,
        "Длительность должна быть целым числом больше нуля",
      );
    }
    service.duration = duration;
  }
  return service;
}

async function createService(req, res) {
  const service = await Services.create(validateServiceInput(req.body || {}));
  return res.status(201).json(service);
}

async function updateService(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, "Некорректный id услуги");
  }
  const service = await Services.findByPk(id);
  if (!service) throw new HttpError(404, "Услуга не найдена");
  await service.update(validateServiceInput(req.body || {}, true));
  return res.json(service);
}

async function deleteService(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, "Некорректный id услуги");
  }
  const service = await Services.findByPk(id);
  if (!service) throw new HttpError(404, "Услуга не найдена");
  if (await Appointments.count({ where: { serviceId: id } })) {
    throw new HttpError(409, "Нельзя удалить услугу, связанную с записями");
  }
  await service.destroy();
  return res.status(204).end();
}

async function getMasters(req, res) {
  const masters = await Masters.findAll({
    attributes: ["id", "name", "role", "specialty"],
    order: [["id", "ASC"]],
  });
  const serviceIdsByMaster = {
    1: [1, 2],
    2: [4],
    3: [3],
  };
  return res.json(
    masters.map((master) => ({
      ...master.get({ plain: true }),
      serviceIds: serviceIdsByMaster[master.id] || [],
    })),
  );
}

async function getSlots(req, res) {
  const masterId = Number(req.params.id);
  const { date } = req.query;
  if (!Number.isSafeInteger(masterId) || masterId < 1) {
    throw new HttpError(400, "Некорректный id мастера");
  }
  if (!isValidDate(date)) {
    throw new HttpError(400, "Укажите дату в формате YYYY-MM-DD");
  }
  if (!(await Masters.findByPk(masterId))) {
    throw new HttpError(404, "Мастер не найден");
  }

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const closingHour = weekday === 0 || weekday === 6 ? 20 : 21;
  const today = localDateString(new Date());
  if (date < today) return res.json([]);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const bookedAppointments = await Appointments.findAll({
    attributes: ["timeStr"],
    where: {
      barberId: masterId,
      date,
      status: { [Op.ne]: "Cancelled" },
    },
  });
  const booked = new Set(bookedAppointments.map(({ timeStr }) => timeStr));
  const slots = [];

  for (let hour = 10; hour < closingHour; hour += 1) {
    const time = `${String(hour).padStart(2, "0")}:00`;
    const isInFuture =
      date !== today || hour * 60 > currentMinutes;
    if (isInFuture && !booked.has(time)) {
      slots.push({ time, available: true });
    }
  }

  return res.json(slots);
}

async function createAppointment(req, res) {
  const { masterId, serviceId, slot, name, phone } = req.body || {};
  const date = req.body?.date || localDateString(new Date());

  if (typeof name !== "string" || !name) {
    throw new HttpError(400, "Введите имя");
  }
  if (typeof phone !== "string" || !phone) {
    throw new HttpError(400, "Введите телефон");
  }
  if (
    !Number.isSafeInteger(Number(masterId)) ||
    Number(masterId) < 1 ||
    !Number.isSafeInteger(Number(serviceId)) ||
    Number(serviceId) < 1
  ) {
    throw new HttpError(400, "Выберите мастера и услугу");
  }
  if (typeof slot !== "string" || !/^([01]\d|2[0-3]):00$/.test(slot)) {
    throw new HttpError(400, "Выберите время");
  }
  if (!isValidDate(date)) {
    throw new HttpError(400, "Укажите дату в формате YYYY-MM-DD");
  }
  const today = localDateString(new Date());
  const now = new Date();
  if (
    date < today ||
    (date === today &&
      Number(slot.slice(0, 2)) * 60 <=
        now.getHours() * 60 + now.getMinutes())
  ) {
    throw new HttpError(400, "Нельзя записаться на прошедшее время");
  }

  const barber = await Masters.findByPk(Number(masterId));
  const service = await Services.findByPk(Number(serviceId));
  if (!barber || !service) {
    throw new HttpError(400, "Мастер или услуга не найдены");
  }

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const closingHour = weekday === 0 || weekday === 6 ? 20 : 21;
  if (
    Number(slot.slice(0, 2)) < 10 ||
    Number(slot.slice(0, 2)) >= closingHour
  ) {
    throw new HttpError(400, "Выбранное время вне графика работы");
  }

  const created = await sequelize.transaction(
    { type: Transaction.TYPES.IMMEDIATE },
    async (transaction) => {
      const existing = await Appointments.findOne({
        attributes: ["id"],
        where: {
          barberId: barber.id,
          date,
          timeStr: slot,
          status: { [Op.ne]: "Cancelled" },
        },
        transaction,
      });
      if (existing) throw new HttpError(409, "Это время уже занято");

      return Appointments.create(
        {
          name,
          phone,
          barberId: barber.id,
          serviceId: service.id,
          date,
          dateStr: dateLabel(new Date(`${date}T12:00:00`)),
          timeStr: slot,
          totalPrice: service.price,
          status: "Pending",
        },
        { transaction },
      );
    },
  );

  const appointment = await Appointments.findByPk(created.id, {
    include: appointmentIncludes(),
  });
  return res
    .status(201)
    .json({ appointment: serializeAppointment(appointment) });
}

async function getAdminAppointments(req, res) {
  const appointments = await Appointments.findAll({
    include: appointmentIncludes(),
    order: [
      ["date", "ASC"],
      ["timeStr", "ASC"],
    ],
  });
  return res.json(appointments.map(serializeAppointment));
}

async function deleteAdminAppointment(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, "Некорректный id записи");
  }
  const deleted = await Appointments.destroy({ where: { id } });
  if (!deleted) throw new HttpError(404, "Запись не найдена");
  return res.status(204).end();
}

async function deleteAllAdminAppointments(req, res) {
  await Appointments.destroy({ where: {} });
  return res.status(204).end();
}

async function updateAppointment(req, res) {
  const id = Number(req.params.id);
  const { status, note } = req.body || {};
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, "Некорректный id записи");
  }
  const hasStatus = Object.hasOwn(req.body || {}, "status");
  const hasNote = Object.hasOwn(req.body || {}, "note");
  if (hasStatus && !STATUS_VALUES.has(status)) {
    throw new HttpError(
      400,
      "Статус должен быть Pending, Confirmed или Cancelled",
    );
  }
  if (!hasStatus && (!hasNote || typeof note !== "string")) {
    throw new HttpError(400, "Укажите корректный статус или заметку");
  }

  const appointment = await Appointments.findByPk(id);
  if (!appointment) throw new HttpError(404, "Запись не найдена");

  if (hasStatus && status !== "Cancelled") {
    const conflict = await Appointments.findOne({
      attributes: ["id"],
      where: {
        id: { [Op.ne]: id },
        barberId: appointment.barberId,
        date: appointment.date,
        timeStr: appointment.timeStr,
        status: { [Op.ne]: "Cancelled" },
      },
    });
    if (conflict) throw new HttpError(409, "Это время уже занято");
  }

  await appointment.update({
    ...(hasStatus ? { status } : {}),
    ...(hasNote ? { note } : {}),
  });
  const updated = await Appointments.findByPk(id, {
    include: appointmentIncludes(),
  });
  return res.json({ appointment: serializeAppointment(updated) });
}

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService,
  getMasters,
  getSlots,
  createAppointment,
  getAdminAppointments,
  deleteAdminAppointment,
  deleteAllAdminAppointments,
  updateAppointment,
};

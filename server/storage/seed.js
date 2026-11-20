const { Appointments, Masters, Services } = require("./models");

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(date) {
  return date.toLocaleDateString("ru-RU");
}

async function seedDatabase() {
  if ((await Services.count()) === 0) {
    await Services.bulkCreate([
      { id: 1, name: "Стрижка", price: 1500, duration: 45 },
      { id: 2, name: "Окрашивание", price: 3000, duration: 120 },
      { id: 3, name: "Укладка", price: 1200, duration: 20 },
      { id: 4, name: "Визаж", price: 2000, duration: 60 },
    ]);
  }

  if ((await Masters.count()) === 0) {
    await Masters.bulkCreate([
      {
        id: 1,
        name: "Анна",
        role: "Мастер",
        specialty: "Окрашивание и стрижка",
      },
      { id: 2, name: "Ирина", role: "Мастер", specialty: "Визаж" },
      { id: 3, name: "Елена", role: "Мастер", specialty: "Укладка" },
    ]);
  }

  if ((await Appointments.count()) === 0) {
    const today = new Date();
    const definitions = [
      {
        name: "Мария Смирнова",
        phone: "+7 (900) 111-22-33",
        barberId: 1,
        serviceId: 1,
        dayOffset: 0,
        timeStr: "10:00",
        status: "Pending",
      },
      {
        name: "Екатерина Иванова",
        phone: "+7 (900) 222-33-44",
        barberId: 2,
        serviceId: 4,
        dayOffset: 1,
        timeStr: "12:00",
        status: "Confirmed",
      },
      {
        name: "Ольга Петрова",
        phone: "+7 (900) 333-44-55",
        barberId: 3,
        serviceId: 3,
        dayOffset: 2,
        timeStr: "14:00",
        status: "Pending",
      },
    ];

    for (const definition of definitions) {
      const service = await Services.findByPk(definition.serviceId);
      const date = new Date(today);
      date.setDate(date.getDate() + definition.dayOffset);
      const isoDate = localDateString(date);
      await Appointments.create({
        name: definition.name,
        phone: definition.phone,
        barberId: definition.barberId,
        serviceId: definition.serviceId,
        date: isoDate,
        dateStr: dateLabel(date),
        timeStr: definition.timeStr,
        totalPrice: service.price,
        status: definition.status,
      });
    }
  }

  await normalizeAppointmentDates();
}

async function normalizeAppointmentDates() {
  const appointments = await Appointments.findAll({
    attributes: ["id", "date"],
  });
  for (const appointment of appointments) {
    const localDate = new Date(`${appointment.date}T12:00:00`);
    const expectedLabel = dateLabel(localDate);
    if (appointment.dateStr !== expectedLabel) {
      await appointment.update({ dateStr: expectedLabel });
    }
  }
}

module.exports = { seedDatabase };

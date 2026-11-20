import React, { useEffect, useState } from "react";
import useBooking from "../hooks/useBooking";

// ...existing code...

const SCHEDULES_KEY = "simple_schedules";

function readSchedules() {
  try {
    const raw = localStorage.getItem(SCHEDULES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const obj = {};
    (Array.isArray(arr) ? arr : []).forEach((s) => {
      if (s?.barberId != null) obj[s.barberId] = s;
    });
    return obj;
  } catch {
    return {};
  }
}

const BookingForm = () => {
  const {
    masters,
    services,
    slots,
    formData,
    errors,
    status,
    handleChange,
    handleSubmit,
  } = useBooking();
  const [schedules, setSchedules] = useState({});

  useEffect(() => {
    setSchedules(readSchedules());
    const onStorage = (e) => {
      if (e.key === SCHEDULES_KEY) setSchedules(readSchedules());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const buttonStates = {
    idle: { text: "Записаться", className: "bg-blue-600 hover:bg-blue-700" },
    loading: {
      text: "Отправка...",
      className: "bg-slate-400 cursor-not-allowed",
    },
    success: { text: "✅ Успешно!", className: "bg-green-600" },
    error: { text: "❌ Ошибка", className: "bg-red-600" },
  };
  const btn = buttonStates[status] || buttonStates.idle;

  const currentSchedule = schedules?.[Number(formData.masterId)] || null;
  const selectedWeekday = formData.date
    ? new Date(`${formData.date}T12:00:00`).getDay()
    : null;
  const salonOpeningTime = "10:00";
  const salonClosingTime =
    selectedWeekday === 0 || selectedWeekday === 6 ? "20:00" : "21:00";
  const displayedStartTime =
    (currentSchedule?.startTime || salonOpeningTime) > salonOpeningTime
      ? currentSchedule.startTime
      : salonOpeningTime;
  const requestedEndTime = currentSchedule?.endTime || salonClosingTime;
  const displayedEndTime =
    requestedEndTime < salonClosingTime ? requestedEndTime : salonClosingTime;
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const daysLabel = (cur) => {
    const map = {
      Mon: "Пн",
      Tue: "Вт",
      Wed: "Ср",
      Thu: "Чт",
      Fri: "Пт",
      Sat: "Сб",
      Sun: "Вс",
    };
    return (
      (cur?.workDays || []).map((k) => map[k] || k).join(", ") ||
      "дни не заданы"
    );
  };

  return (
    <section
      id="booking"
      className="relative overflow-hidden bg-slate-950 py-16 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Всего несколько шагов
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Онлайн-запись
          </h2>
          <p className="mt-3 text-slate-300">
            Выберите мастера, услугу и время — оставьте контакты для
            подтверждения.
          </p>
        </div>

        <div
          className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          aria-label="Этапы записи"
        >
          {["Мастер", "Услуга", "Время", "Контакты"].map((step, index) => {
            const complete = [
              formData.masterId,
              formData.serviceId,
              formData.slot,
              formData.name && formData.phone,
            ][index];
            return (
              <div
                key={step}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium sm:text-sm ${complete ? "border-blue-500/40 bg-blue-600/10 text-blue-400" : "border-slate-800 bg-slate-900 text-slate-400"}`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${complete ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
                >
                  {index + 1}
                </span>
                {step}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm sm:p-8">
          {currentSchedule && (
            <div className="mb-5 rounded-xl border border-slate-800 bg-slate-800 p-4 text-sm leading-6 text-slate-300">
              <div>
                <span className="font-semibold">Рабочие дни:</span>{" "}
                {daysLabel(currentSchedule)}
              </div>
              <div>
                <span className="font-semibold">Часы работы:</span>{" "}
                {displayedStartTime} – {displayedEndTime}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="booking-master"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Мастер
              </label>
              <select
                id="booking-master"
                name="masterId"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                value={formData.masterId || ""}
                onChange={handleChange}
              >
                <option value="">Выберите мастера</option>
                {masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {errors?.masterId && (
                <p className="mt-1 text-sm text-red-300">{errors.masterId}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="booking-service"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Услуга
              </label>
              <select
                id="booking-service"
                name="serviceId"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                value={formData.serviceId || ""}
                onChange={handleChange}
              >
                <option value="">Выберите услугу</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors?.serviceId && (
                <p className="mt-1 text-sm text-red-300">{errors.serviceId}</p>
              )}
            </div>

            {/* Слоты остаются как есть; при необходимости их можно фильтровать по часам currentSchedule */}
            <div>
              <label
                htmlFor="booking-date"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Дата
              </label>
              <input
                id="booking-date"
                name="date"
                type="date"
                min={minDate}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                value={formData.date || ""}
                onChange={handleChange}
              />
              {errors?.date && (
                <p className="mt-1 text-sm text-red-300">{errors.date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="booking-slot"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Время
              </label>
              <select
                id="booking-slot"
                name="slot"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                value={formData.slot || ""}
                onChange={handleChange}
              >
                <option value="">Выберите время</option>
                {slots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors?.slot && (
                <p className="mt-1 text-sm text-red-300">{errors.slot}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="booking-name"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Ваше имя
              </label>
              <input
                id="booking-name"
                name="name"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                type="text"
                placeholder="Как к вам обращаться"
                value={formData.name || ""}
                onChange={handleChange}
              />
              {errors?.name && (
                <p className="mt-1 text-sm text-red-300">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="booking-phone"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Телефон
              </label>
              <input
                id="booking-phone"
                name="phone"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={formData.phone || ""}
                onChange={handleChange}
              />
              {errors?.phone && (
                <p className="mt-1 text-sm text-red-300">{errors.phone}</p>
              )}
            </div>

            {errors?.global && (
              <p className="rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-300 sm:col-span-2">
                {errors.global}
              </p>
            )}

            {status === "success" && (
              <p
                role="status"
                className="rounded-xl border border-green-900 bg-green-950 px-4 py-3 text-sm font-medium text-green-300 sm:col-span-2"
              >
                Спасибо! Ваша заявка сохранена. Мы свяжемся с вами для
                подтверждения.
              </p>
            )}

            <button
              type="submit"
              className={`w-full rounded-xl px-5 py-3.5 font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 sm:col-span-2 ${btn.className}`}
              disabled={status === "loading"}
            >
              {btn.text}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BookingForm;

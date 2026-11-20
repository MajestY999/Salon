import { useEffect, useMemo, useState } from "react";
import {
  createAppointment,
  getAvailableSlots,
  getMasters,
  getServices,
} from "../utils/api";

const SCHEDULES_KEY = "simple_schedules";

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readSchedules() {
  try {
    const raw = localStorage.getItem(SCHEDULES_KEY);
    const schedules = raw ? JSON.parse(raw) : [];
    return Array.isArray(schedules) ? schedules : [];
  } catch {
    return [];
  }
}

const DEFAULT_WORK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function useBooking() {
  const [masters, setMasters] = useState([]);
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [formData, setFormData] = useState({
    masterId: "",
    serviceId: "",
    slot: "",
    date: localDateString(new Date()),
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getMasters(), getServices()])
      .then(([masterList, serviceList]) => {
        if (!active) return;
        setMasters(masterList);
        setServices(serviceList);
      })
      .catch((error) => {
        if (active) {
          setStatus("error");
          setErrors({ global: error.message });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const loadSchedules = (masterList = masters) => {
      const byMaster = {};
      readSchedules().forEach((schedule) => {
        if (schedule?.barberId != null) {
          const legacyEmptySchedule =
            Array.isArray(schedule.workDays) &&
            schedule.workDays.length === 0 &&
            (!schedule.startTime || schedule.startTime === "09:00");
          byMaster[schedule.barberId] = {
            ...schedule,
            workDays:
              !Array.isArray(schedule.workDays) || legacyEmptySchedule
                ? DEFAULT_WORK_DAYS
                : schedule.workDays,
            startTime: schedule.startTime || "10:00",
            endTime: schedule.endTime || "21:00",
          };
        }
      });
      masterList.forEach((master) => {
        if (!byMaster[master.id]) {
          byMaster[master.id] = {
            barberId: master.id,
            workDays: DEFAULT_WORK_DAYS,
            startTime: "10:00",
            endTime: "21:00",
          };
        }
      });
      setSchedules(byMaster);
      if (masterList.length) {
        localStorage.setItem(
          SCHEDULES_KEY,
          JSON.stringify(Object.values(byMaster)),
        );
      }
    };
    loadSchedules();
    const onStorage = (event) => {
      if (event.key === SCHEDULES_KEY) loadSchedules();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [masters]);

  const masterId = formData.masterId;
  const selectedDate = formData.date;
  useEffect(() => {
    if (!masterId || !selectedDate) {
      setSlots([]);
      return undefined;
    }

    let active = true;
    const schedule = schedules[masterId];
    const weekdayKey = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      new Date(`${selectedDate}T12:00:00`).getDay()
    ];
    if (
      schedule &&
      (!schedule.workDays?.includes(weekdayKey) ||
        !schedule.startTime ||
        !schedule.endTime)
    ) {
      setSlots([]);
      return undefined;
    }

    getAvailableSlots(masterId, selectedDate)
      .then((availableSlots) => {
        if (!active) return;
        const start = schedule?.startTime || "10:00";
        const end = schedule?.endTime || "21:00";
        setSlots(
          availableSlots
            .map(({ time }) => time)
            .filter((time) => time >= start && time < end),
        );
      })
      .catch((error) => {
        if (active) {
          setSlots([]);
          setErrors((previous) => ({ ...previous, global: error.message }));
        }
      });
    return () => {
      active = false;
    };
  }, [masterId, selectedDate, schedules]);

  const visibleServices = useMemo(() => {
    const master = masters.find(
      (item) => item.id === Number(formData.masterId),
    );
    if (!master) return services;
    if (Array.isArray(master.serviceIds)) {
      return services.filter((service) =>
        master.serviceIds.includes(service.id),
      );
    }
    const specialty = master.specialty?.toLocaleLowerCase();
    return specialty
      ? services.filter((service) =>
          specialty.includes(service.name.toLocaleLowerCase()),
        )
      : services;
  }, [services, masters, formData.masterId]);

  const handleChange = (event) => {
    const { name, value } = event?.target || {};
    if (!name) return;
    setErrors({});
    if (name === "masterId") {
      setFormData((previous) => ({
        ...previous,
        masterId: value,
        serviceId: "",
        slot: "",
      }));
    } else if (name === "serviceId" || name === "date") {
      setFormData((previous) => ({ ...previous, [name]: value, slot: "" }));
    } else {
      setFormData((previous) => ({ ...previous, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { masterId, serviceId, slot, date, name, phone } = formData;
    const nextErrors = {};
    if (!masterId) nextErrors.masterId = "Выберите мастера";
    if (!serviceId) nextErrors.serviceId = "Выберите услугу";
    if (!slot) nextErrors.slot = "Выберите время";
    if (!date) nextErrors.date = "Выберите дату";
    if (!name) nextErrors.name = "Введите имя";
    if (!phone) nextErrors.phone = "Введите телефон";
    if (Object.keys(nextErrors).length) {
      setErrors({ ...nextErrors, global: "Заполните обязательные поля" });
      return;
    }

    setStatus("loading");
    setErrors({});
    try {
      await createAppointment({
        masterId: Number(masterId),
        serviceId: Number(serviceId),
        slot,
        date,
        name,
        phone,
      });
      setStatus("success");
      setFormData((previous) => ({
        ...previous,
        masterId: "",
        serviceId: "",
        slot: "",
        name: "",
        phone: "",
      }));
    } catch (error) {
      setStatus("error");
      setErrors({ global: error.message });
    }
    window.setTimeout(() => setStatus("idle"), 2500);
  };

  return {
    masters,
    services: visibleServices,
    schedules,
    slots,
    formData,
    errors,
    status,
    handleChange,
    handleSubmit,
  };
}

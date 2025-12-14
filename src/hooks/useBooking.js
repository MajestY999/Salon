import { useEffect, useMemo, useState } from 'react';

const APPT_KEY = 'simple_appointments';
const SERVICES_KEY = 'simple_services';
const SCHEDULES_KEY = 'simple_schedules';

function readJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export default function useBooking() {
  const [masters, setMasters] = useState([]);
  const [services, setServices] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [formData, setFormData] = useState({
    masterId: '',
    serviceId: '',
    slot: '',
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  // мастера: берём из DEFAULT команды (Team.jsx) если нет API
  useEffect(() => {
    // Попытка прочитать мастеров из localStorage, иначе из DOM/статического списка не делаем
    // Здесь можно заменить на ваш getMasters() при наличии API
    const teamDefaults = [
      { id: 1, name: 'Анна' },
      { id: 2, name: 'Ирина' },
      { id: 3, name: 'Елена' },
    ];
    setMasters(teamDefaults);
  }, []);

  // услуги из админки
  useEffect(() => {
    setServices(readJSON(SERVICES_KEY, []));
    const onStorage = (e) => {
      if (e.key === SERVICES_KEY) setServices(readJSON(SERVICES_KEY, []));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // расписания из админки
  useEffect(() => {
    const schArr = readJSON(SCHEDULES_KEY, []);
    const schObj = {};
    schArr.forEach(s => { if (s?.barberId != null) schObj[s.barberId] = s; });
    setSchedules(schObj);

    const onStorage = (e) => {
      if (e.key === SCHEDULES_KEY) {
        const arr = readJSON(SCHEDULES_KEY, []);
        const obj = {};
        arr.forEach(s => { if (s?.barberId != null) obj[s.barberId] = s; });
        setSchedules(obj);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // видимые услуги (можно фильтровать по мастеру, если нужно)
  const visibleServices = useMemo(() => services, [services, formData.masterId]);

  // слоты: генерируем по расписанию мастера
  const [baseSlots, setBaseSlots] = useState([]);
  useEffect(() => {
    const mid = Number(formData.masterId);
    const sid = Number(formData.serviceId);
    if (!mid || !sid) { setBaseSlots([]); return; }

    const sch = schedules[mid];
    if (!sch?.startTime || !sch?.endTime) { setBaseSlots([]); return; }

    const toMin = (t) => {
      const m = String(t).match(/^(\d{2}):(\d{2})$/);
      return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    };
    const sMin = toMin(sch.startTime);
    const eMin = toMin(sch.endTime);
    if (sMin == null || eMin == null || sMin >= eMin) { setBaseSlots([]); return; }

    // шаг 30 минут
    const nextSlots = [];
    for (let m = sMin; m <= eMin; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      nextSlots.push(`${hh}:${mm}`);
    }
    setBaseSlots(nextSlots);
  }, [formData.masterId, formData.serviceId, schedules]);

  const slots = baseSlots;

  const handleChange = (e) => {
    const { name, value } = e?.target || {};
    if (!name) return;
    setErrors({});
    if (name === 'masterId') {
      setFormData(prev => ({ ...prev, masterId: value, serviceId: '', slot: '' }));
    } else if (name === 'serviceId') {
      setFormData(prev => ({ ...prev, serviceId: value, slot: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { masterId, serviceId, slot, name, phone } = formData;
    const errs = {};
    if (!masterId) errs.masterId = 'Выберите мастера';
    if (!serviceId) errs.serviceId = 'Выберите услугу';
    if (!slot) errs.slot = 'Выберите время';
    if (!name) errs.name = 'Введите имя';
    if (!phone) errs.phone = 'Введите телефон';
    if (Object.keys(errs).length) { setErrors({ ...errs, global: 'Заполните обязательные поля' }); return; }

    setStatus('loading');
    const svc = services.find(s => s.id === Number(serviceId));
    const master = masters.find(m => m.id === Number(masterId));
    const totalPrice = svc?.price ?? null;

    const item = {
      id: Date.now(),
      name,
      phone,
      barberId: Number(masterId),
      barberName: master?.name || '',
      serviceId: Number(serviceId),
      serviceName: svc?.name || '',
      dateStr: new Date().toLocaleDateString(),
      timeStr: slot,
      totalPrice,
      status: 'new',
      note: '',
    };

    try {
      const cur = readJSON(APPT_KEY, []);
      const next = [...cur, item];
      localStorage.setItem(APPT_KEY, JSON.stringify(next));
      setStatus('success');
      setFormData({ masterId: '', serviceId: '', slot: '', name: '', phone: '' });
    } catch {
      setStatus('error');
      setErrors({ global: 'Ошибка сохранения' });
    }
    setTimeout(() => setStatus('idle'), 2000);
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
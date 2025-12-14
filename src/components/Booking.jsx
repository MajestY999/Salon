import React, { useEffect, useState } from 'react';
import useBooking from '../hooks/useBooking';

// ...existing code...

const SCHEDULES_KEY = 'simple_schedules';

function readSchedules() {
  try {
    const raw = localStorage.getItem(SCHEDULES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const obj = {};
    (Array.isArray(arr) ? arr : []).forEach(s => { if (s?.barberId != null) obj[s.barberId] = s; });
    return obj;
  } catch {
    return {};
  }
}

const BookingForm = () => {
  const { masters, services, slots, formData, errors, status, handleChange, handleSubmit } = useBooking();
  const [schedules, setSchedules] = useState({});

  useEffect(() => {
    setSchedules(readSchedules());
    const onStorage = (e) => {
      if (e.key === SCHEDULES_KEY) setSchedules(readSchedules());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const buttonStates = {
    idle: { text: 'Записаться', className: 'bg-primary hover:bg-red-700' },
    loading: { text: 'Отправка...', className: 'bg-gray-500 cursor-not-allowed' },
    success: { text: '✅ Успешно!', className: 'bg-green-500' },
    error: { text: '❌ Ошибка', className: 'bg-red-500' },
  };
  const btn = buttonStates[status] || buttonStates.idle;

  const currentSchedule = schedules?.[Number(formData.masterId)] || null;
  const daysLabel = (cur) => {
    const map = { Mon: 'Пн', Tue: 'Вт', Wed: 'Ср', Thu: 'Чт', Fri: 'Пт', Sat: 'Сб', Sun: 'Вс' };
    return (cur?.workDays || []).map(k => map[k] || k).join(', ') || 'дни не заданы';
  };

  return (
    <section id="booking" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-8 text-secondary">Онлайн запись</h2>

        {/* Блок расписания выбранного мастера */}
        {currentSchedule && (
          <div className="mb-4 p-3 rounded bg-white shadow-sm text-sm text-gray-700">
            <div><span className="font-semibold">Рабочие дни:</span> {daysLabel(currentSchedule)}</div>
            <div><span className="font-semibold">Часы работы:</span> {(currentSchedule.startTime || '—')} – {(currentSchedule.endTime || '—')}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <select name="masterId" className="w-full border rounded p-2" value={formData.masterId || ''} onChange={handleChange}>
            <option value="">Выберите мастера</option>
            {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {errors?.masterId && <p className="text-red-600 text-sm">{errors.masterId}</p>}

          <select name="serviceId" className="w-full border rounded p-2" value={formData.serviceId || ''} onChange={handleChange}>
            <option value="">Выберите услугу</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors?.serviceId && <p className="text-red-600 text-sm">{errors.serviceId}</p>}

          {/* Слоты остаются как есть; при необходимости их можно фильтровать по часам currentSchedule */}
          <select name="slot" className="w-full border rounded p-2" value={formData.slot || ''} onChange={handleChange}>
            <option value="">Выберите время</option>
            {slots.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors?.slot && <p className="text-red-600 text-sm">{errors.slot}</p>}

          <input name="name" className="w-full border rounded p-2" type="text" placeholder="Ваше имя" value={formData.name || ''} onChange={handleChange} />
          {errors?.name && <p className="text-red-600 text-sm">{errors.name}</p>}

          <input name="phone" className="w-full border rounded p-2" type="tel" placeholder="Телефон" value={formData.phone || ''} onChange={handleChange} />
          {errors?.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}

          {errors?.global && <p className="text-red-600 text-sm">{errors.global}</p>}

          <button type="submit" className={`w-full text-white rounded p-3 ${btn.className}`}>
            {btn.text}
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;
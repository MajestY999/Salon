
export const getMasters = () => Promise.resolve([
  { id: 1, name: 'Анна' },
  { id: 2, name: 'Ирина' },
  { id: 3, name: 'Елена' },
]);

export const getServicesByMaster = (masterId) => {
  const map = {
    1: [{ id: 1, name: 'Стрижка', duration: 45 }, { id: 2, name: 'Окрашивание', duration: 120 }],
    2: [{ id: 1, name: 'Стрижка', duration: 30 }, { id: 3, name: 'Укладка', duration: 20 }],
    3: [{ id: 4, name: 'Визаж', duration: 60 }],
  };
  return Promise.resolve(map[masterId] || []);
};

export const getAvailableSlots = (masterId, serviceId, date = new Date()) => {
  
  const slots = [];
  const start = 10;
  const end = 19;
  for (let h = start; h < end; h++) {
    for (let m of [0, 30]) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      if (!((h === 12 && m === 0) || (h === 15 && m === 30))) {
        slots.push({ time: timeStr, available: true });
      }
    }
  }
  return Promise.resolve(slots);
};
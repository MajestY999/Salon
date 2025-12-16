import React, { useEffect, useState } from 'react';

const SERVICES_KEY = 'simple_services';

// витринные данные (desc, icon)
const DEFAULT_SHOWCASE = [
  { id: 1, name: 'Стрижка', desc: 'Классическая, мужская, женская, детская', icon: '✂️' },
  { id: 2, name: 'Окрашивание', desc: 'Балаяж, мелирование, тонирование', icon: '🎨' },
  { id: 3, name: 'Укладка', desc: 'Повседневная, вечерняя, свадебная', icon: '💇‍♀️' },
  { id: 4, name: 'Визаж', desc: 'Дневной, вечерний, коррекция бровей', icon: '💄' },
];

function readAdminServices() {
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const Services = () => {
  const [selected, setSelected] = useState(null);
  const [adminServices, setAdminServices] = useState([]);

  useEffect(() => {
    setAdminServices(readAdminServices());
    const onStorage = (e) => {
      if (e.key === SERVICES_KEY) setAdminServices(readAdminServices());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // карта витринных desc/icon по id
  const showcaseById = DEFAULT_SHOWCASE.reduce((acc, def) => {
    acc[def.id] = def;
    return acc;
  }, {});

  // итоговый список:
  // - все услуги из админки (включая новые)
  // - для известных id берем desc/icon из витрины
  // - для новых id ставим дефолтные desc/icon
  const merged = adminServices.map(s => {
    const def = showcaseById[s.id];
    const name = s.name ?? def?.name ?? 'Услуга';
    const priceNum = typeof s.price === 'number' ? s.price : Number(s.price);
    return {
      id: s.id,
      name,
      desc: def?.desc ?? 'Индивидуальная услуга',
      icon: def?.icon ?? '✨',
      priceText: Number.isFinite(priceNum) ? `от ${priceNum} ₽` : '—',
    };
  });

  // если админка пуста, показываем витринные дефолтные (без цен)
  const listToRender = merged.length
    ? merged
    : DEFAULT_SHOWCASE.map(def => ({
        id: def.id,
        name: def.name,
        desc: def.desc,
        icon: def.icon,
        priceText: '—',
      }));

  return (
    <section id="services" className="py-16 bg-light">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-secondary">Наши услуги</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listToRender.map(s => (
            <div
              key={s.id}
              onClick={() => setSelected(selected === s.id ? null : s.id)}
              className={`p-6 rounded-xl shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${selected === s.id ? 'ring-4 ring-primary bg-white scale-105' : 'bg-white'}`}
            >
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="font-bold text-lg">{s.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{s.desc}</p>
              <p className="font-semibold text-primary">{s.priceText}</p>
            </div>
          ))}
        </div>
        {/* Редактирование — только в админке. */}
      </div>
    </section>
  );
};

export default Services;
import React, { useEffect, useState } from "react";
import { getServices } from "../utils/api";

// витринные данные (desc, icon)
const DEFAULT_SHOWCASE = [
  {
    id: 1,
    name: "Стрижка",
    desc: "Классическая, мужская, женская, детская",
    icon: "✂️",
  },
  {
    id: 2,
    name: "Окрашивание",
    desc: "Балаяж, мелирование, тонирование",
    icon: "🎨",
  },
  {
    id: 3,
    name: "Укладка",
    desc: "Повседневная, вечерняя, свадебная",
    icon: "💇‍♀️",
  },
  {
    id: 4,
    name: "Визаж",
    desc: "Дневной, вечерний, коррекция бровей",
    icon: "💄",
  },
];

const Services = () => {
  const [adminServices, setAdminServices] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    getServices()
      .then((services) => {
        if (active) setAdminServices(services);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });
    return () => {
      active = false;
    };
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
  const merged = adminServices.map((s) => {
    const def = showcaseById[s.id];
    const name = s.name ?? def?.name ?? "Услуга";
    const priceNum = typeof s.price === "number" ? s.price : Number(s.price);
    return {
      id: s.id,
      name,
      desc: def?.desc ?? "Индивидуальная услуга",
      icon: def?.icon ?? "✨",
      priceText: Number.isFinite(priceNum) ? `от ${priceNum} ₽` : "—",
    };
  });

  // если админка пуста, показываем витринные дефолтные (без цен)
  const listToRender = merged.length
    ? merged
    : DEFAULT_SHOWCASE.map((def) => ({
        id: def.id,
        name: def.name,
        desc: def.desc,
        icon: def.icon,
        priceText: "—",
      }));

  return (
    <section id="services" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Уход и красота
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Наши услуги
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Ознакомьтесь с услугами и ценами — запись доступна в форме ниже.
          </p>
          {loadError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              Не удалось загрузить услуги: {loadError}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listToRender.map((s) => (
            <article
              key={s.id}
              className="flex min-h-56 cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl"
                aria-hidden="true"
              >
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{s.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                {s.desc}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="font-semibold text-blue-600">{s.priceText}</p>
              </div>
            </article>
          ))}
        </div>
        {/* Редактирование — только в админке. */}
      </div>
    </section>
  );
};

export default Services;

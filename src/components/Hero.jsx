import React from "react";

const Hero = () => {
  const scrollToBooking = (e) => {
    e.preventDefault();
    const el = document.getElementById("booking");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 px-4 py-20 sm:py-24 lg:py-28"
    >
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-5xl text-center">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Ваш стиль — наше призвание
        </h1>
        <p className="mx-auto mb-8 mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
          Профессиональные мастера, современные технологии и уютная атмосфера —
          для вашей красоты и уверенности каждый день.
        </p>
        <a
          href="#booking"
          onClick={scrollToBooking}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 sm:text-base"
        >
          Записаться онлайн
        </a>
        <div className="mx-auto mt-14 grid max-w-4xl gap-3 text-left sm:grid-cols-3 sm:gap-4">
          {[
            ["24/7", "Онлайн-запись в любое время"],
            ["Профи", "Проверенные мастера"],
            ["Честно", "Прозрачные цены на услуги"],
          ].map(([title, description]) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm sm:p-5"
            >
              <p className="font-semibold text-blue-400">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;

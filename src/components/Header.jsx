import React, { useState } from "react";

const links = [
  { label: "Услуги", id: "services" },
  { label: "Команда", id: "team" },
  { label: "Запись", id: "booking" },
  { label: "Контакты", id: "contacts" },
];

const Header = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="#home"
          className="text-lg font-bold tracking-tight text-white sm:text-xl"
        >
          Стиль <span className="text-blue-600">&</span> Красота
        </a>

        <nav
          aria-label="Основная навигация"
          className="hidden items-center gap-7 md:flex"
        >
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400"
              type="button"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("booking")}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            type="button"
          >
            Записаться
          </button>
        </nav>

        <button
          className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
          aria-expanded={open}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m6 6 12 12M18 6 6 18"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          aria-label="Мобильная навигация"
          className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden"
        >
          <div className="mx-auto grid max-w-7xl gap-1">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-blue-400"
                type="button"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo("booking")}
              className="mt-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="button"
            >
              Записаться
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;

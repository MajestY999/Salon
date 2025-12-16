import React, { useState } from 'react';

const links = [
  { label: 'Услуги', id: 'services' },
  { label: 'Команда', id: 'team' },
  { label: 'Запись', id: 'booking' },
  { label: 'Контакты', id: 'contacts' },
];

const Header = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-secondary">Стиль & Красота</h1>

        {/* Desktop nav */}
        <nav className="hidden md:flex space-x-6">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="hover:text-primary transition-colors text-gray-700"
              type="button"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setOpen(v => !v)}
          aria-label="Меню"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-3 grid gap-3">
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-left py-2 px-2 rounded hover:bg-gray-50"
                type="button"
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
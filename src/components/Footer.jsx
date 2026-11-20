import React from "react";

// плавный скролл к секции
function scrollToId(id) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {/* Бренд */}
        <div>
          <a href="#home" className="text-lg font-bold text-white">
            Стиль <span className="text-blue-400">&</span> Красота
          </a>
          <p className="mt-3 text-sm text-slate-400">
            © {new Date().getFullYear()} Салон красоты
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Красота и уход — каждый день.
          </p>
        </div>

        {/* Контакты */}
        <div>
          <h4 className="mb-3 font-semibold text-white">Контакты</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <a
                href="tel:+70000000000"
                className="text-blue-400 hover:text-blue-500"
              >
                +7 (000) 000-00-00
              </a>
            </li>
            <li>
              <a
                href="mailto:info@salon-style.ru"
                className="hover:text-blue-400"
              >
                info@salon-style.ru
              </a>
            </li>
            <li>г. Владивосток, ул. Гоголя, д. 41</li>
            <li>
              <a
                href="#contacts"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("#contacts");
                }}
                className="hover:text-blue-400"
              >
                Как добраться
              </a>
            </li>
          </ul>
        </div>

        {/* Соцсети */}
        <div>
          <h4 className="mb-3 font-semibold text-white">Мы в соцсетях</h4>
          <div className="flex gap-3 text-sm">
            <a
              href="https://vk.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
            >
              VK
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
            >
              Telegram
            </a>
          </div>
        </div>

        {/* Быстрые ссылки */}
        <div>
          <h4 className="mb-3 font-semibold text-white">Навигация</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <a href="#services" className="hover:text-blue-400">
                Услуги
              </a>
            </li>
            <li>
              <a href="#booking" className="hover:text-blue-400">
                Онлайн-запись
              </a>
            </li>
            <li>
              <a
                href="#team"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("#team");
                }}
                className="hover:text-blue-400"
              >
                Команда
              </a>
            </li>
            <li>
              <a
                href="#contacts"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId("#contacts");
                }}
                className="hover:text-blue-400"
              >
                Контакты
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Нижняя панель */}
      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-800 px-4 pt-5 sm:px-6 lg:px-8">
        <p className="text-xs leading-5 text-slate-400">
          Работаем: Пн–Пт 10:00–21:00 · Сб–Вс 10:00–18:00
        </p>
      </div>
    </footer>
  );
};

export default Footer;

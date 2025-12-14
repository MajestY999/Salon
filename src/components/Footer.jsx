import React from 'react';

// плавный скролл к секции
function scrollToId(id) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const Footer = () => {
  return (
    <footer className="py-10 bg-gray-100 border-t">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Бренд */}
        <div>
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} Ваш салон</p>
          <p className="mt-2 text-sm text-gray-500">Красота и уход — каждый день.</p>
        </div>

        {/* Контакты */}
        <div>
          <h4 className="font-semibold mb-2">Контакты</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li><a href="tel:+79990000000" className="hover:underline">+7 (999) 000-00-00</a></li>
            <li><a href="mailto:info@salon.ru" className="hover:underline">info@salon.ru</a></li>
            <li>г. Владивосток, ул. Гоголя, д. 41</li>
            <li>
              {/* якорь “как добраться” — ведёт к секции с id="#контакты" */}
              <a
                href="#контакты"
                onClick={(e) => { e.preventDefault(); scrollToId('#контакты'); }}
                className="hover:underline"
              >
                Как добраться
              </a>
            </li>
          </ul>
        </div>

        {/* Соцсети */}
        <div>
          <h4 className="font-semibold mb-2">Мы в соцсетях</h4>
          <div className="flex gap-3 text-sm">
            <a href="https://vk.com" target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-white shadow hover:bg-gray-50">VK</a>
            <a href="https://t.me" target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-white shadow hover:bg-gray-50">Telegram</a>
          </div>
        </div>

        {/* Быстрые ссылки */}
        <div>
          <h4 className="font-semibold mb-2">Навигация</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {/* Эти работают как есть */}
            <li><a href="#услуги" className="hover:underline">Услуги</a></li>
            <li><a href="#booking" className="hover:underline">Онлайн запись</a></li>
            {/* Команда — делаем принудительный скролл */}
            <li>
              <a
                href="#team"
                onClick={(e) => { e.preventDefault(); scrollToId('#team'); }}
                className="hover:underline"
              >
                Команда
              </a>
            </li>
            {/* Контакты — используем id "#контакты" (или поменяйте на '#contacts' если у вас так) */}
            <li>
              <a
                href="#контакты"
                onClick={(e) => { e.preventDefault(); scrollToId('#контакты'); }}
                className="hover:underline"
              >
                Контакты
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Нижняя панель */}
      <div className="container mx-auto px-4 mt-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-500">Работаем: <br />Пн–Пт 10:00–21:00<br />  Сб-Вс 10:00–18:00</p>
        <a
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-white hover:bg-red-700 transition"
          title="Перейти в админ-панель"
        >
          Админ панель
        </a>
      </div>
    </footer>
  );
};

export default Footer;
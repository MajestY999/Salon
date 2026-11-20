import React from "react";

const ContactMap = () => (
  <section id="contacts" className="bg-white py-16 sm:py-20 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center sm:mb-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Будем рады видеть вас
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Контакты
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
          <h3 className="mb-6 text-xl font-semibold text-slate-900">
            Салон «Стиль & Красота»
          </h3>
          <p className="mb-4 flex items-start text-slate-600">
            <span className="mr-3 text-blue-600" aria-hidden="true">
              ⌖
            </span>
            <span>г. Владивосток, ул. Гоголя, д. 41</span>
          </p>
          <p className="mb-4 flex items-center text-slate-600">
            <span className="mr-3 text-blue-600" aria-hidden="true">
              ☎
            </span>
            <a
              href="tel:+70000000000"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              +7 (000) 000-00-00
            </a>
          </p>
          <p className="mb-6 flex items-center text-slate-600">
            <span className="mr-3 text-blue-600" aria-hidden="true">
              ✉
            </span>
            <a
              href="mailto:info@salon-style.ru"
              className="hover:text-blue-600"
            >
              info@salon-style.ru
            </a>
          </p>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 font-semibold text-slate-900">Режим работы</p>
            <p className="text-sm leading-6 text-slate-600">
              Пн–Пт: 10:00–21:00
              <br />
              Сб–Вс: 10:00–20:00
            </p>
          </div>
          <a
            href="#booking"
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Записаться на приём
          </a>
        </div>

        <div className="min-h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm md:min-h-full">
          <div className="h-full min-h-72">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2680.621410464089!2d131.8854512767261!3d43.11958597113939!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5da9fe4baf0c4d2d%3A0x7a0b4a31d1c4d4a0!2z0YPQuy4g0KTQvtC10LzRgdC60L7QstCwLCA0MSwg0JzQvtGB0LrQstCwLdCf0L7QstCw0YHRjNC60LAg0KHQstC40YfQsNC30LHQsA!5e0!3m2!1sru!2sru!4v1734172500000!5m2!1sru!2sru"
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              allowFullScreen=""
              loading="lazy"
              title="Салон «Красота» — ул. Гоголя, 41, Владивосток"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ContactMap;

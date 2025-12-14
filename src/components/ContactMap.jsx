import React from 'react';

const ContactMap = () => (
  <section id="contacts" className="py-16">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12 text-purple-600">Контакты</h2>
      <div className="flex flex-col md:flex-row gap-8">
        
        <div className="md:w-1/2 bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-4">Салон «Красота»</h3>
          <p className="flex items-start mb-2">
            📍 <span className="ml-2">г. Владивосток, ул. Гоголя, д. 41</span>
          </p>
          <p className="flex items-center mb-2">
            📞 <span className="ml-2">+7 (000) 000-00-00</span>
          </p>
          <p className="flex items-center mb-2">
            📧 <span className="ml-2">info@salon-style.ru</span>
          </p>
          <p className="mt-4">
            <strong>Режим работы:</strong><br />
            Пн–Пт: 10:00–21:00<br />
            Сб–Вс: 10:00–20:00
          </p>
        </div>

        
        <div className="md:w-1/2">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2680.621410464089!2d131.8854512767261!3d43.11958597113939!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5da9fe4baf0c4d2d%3A0x7a0b4a31d1c4d4a0!2z0YPQuy4g0KTQvtC10LzRgdC60L7QstCwLCA0MSwg0JzQvtGB0LrQstCwLdCf0L7QstCw0YHRjNC60LAg0KHQstC40YfQsNC30LHQsA!5e0!3m2!1sru!2sru!4v1734172500000!5m2!1sru!2sru"
              width="100%"
              height="100%"
              style={{ border: 0 }}
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
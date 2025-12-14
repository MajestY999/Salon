import React from 'react';

const Hero = () => {
  const scrollToBooking = (e) => {
    e.preventDefault();
    const el = document.getElementById('booking');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="home" className="relative bg-gradient-to-r from-secondary to-primary text-white py-16 md:py-32 px-4 text-center">
     
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
          Ваш стиль — наше призвание 
        </h2>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Профессиональные мастера, современные технологии и уютная атмосфера ждут вас!
        </p>
        <a
          href="#booking"
          onClick={scrollToBooking}
          className="inline-block bg-white text-primary font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105"
        >
          Записаться онлайн
        </a>
      </div>
    </section>
  );
};

export default Hero;
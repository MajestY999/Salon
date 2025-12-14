import React from 'react';
import AnnaImg from '../assets/anna.jpg';
import IrinaImg from '../assets/Irina.jpg';
import ElenaImg from '../assets/Elena.jpg';

// ...existing code...
const team = [
  { id: 1, name: 'Анна',  role: 'Мастер', specialty: 'Окрашивание и стрижка', img: AnnaImg },
  { id: 2, name: 'Ирина', role: 'Мастер', specialty: 'Визаж',                  img: IrinaImg },
  { id: 3, name: 'Елена', role: 'Мастер', specialty: 'Укладка',                img: ElenaImg },
];

const Team = () => (
  <section id="team" className="py-16">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12 text-secondary">Наша команда</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {team.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
            <img
              src={p.img}
              alt={p.name}
              width={800}
              height={600}
              className="w-full h-64 object-cover"
              loading="lazy"
              decoding="async"
              srcSet={`${p.img} 800w`}
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
            <div className="p-5">
              <h3 className="font-bold text-xl">{p.name}</h3>
              <p className="text-primary font-medium">{p.role}</p>
              <p className="text-gray-600 mt-2">{p.specialty}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Team;

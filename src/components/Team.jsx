import React from 'react';

const team = [
  { id: 1, name: 'Анна ', role:  "мастрер ", specialty: 'Окрашивание и стрижка', img: './pub' },
  { id: 2, name:  'ирина', role:   "мастрер" ,specialty: 'визаж', img: 'irina.jpg' },
  { id: 3, name: 'Елена ', role: "мастрер ", specialty: 'укладка', img: 'elena.jpg' },
];

const Team = () => (
  <section id="команда" className="py-16">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12 text-secondary">Наша команда</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {team.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
            <img src={p.img} alt={p.name} className="w-full h-64 object-cover" />
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
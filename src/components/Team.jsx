import React from "react";
import AnnaImg from "../assets/anna.jpg";
import IrinaImg from "../assets/Irina.jpg";
import ElenaImg from "../assets/Elena.jpg";

// ...existing code...
const team = [
  {
    id: 1,
    name: "Анна",
    role: "Мастер",
    specialty: "Окрашивание и стрижка",
    img: AnnaImg,
  },
  { id: 2, name: "Ирина", role: "Мастер", specialty: "Визаж", img: IrinaImg },
  { id: 3, name: "Елена", role: "Мастер", specialty: "Укладка", img: ElenaImg },
];

const Team = () => (
  <section id="team" className="bg-slate-50 py-16 sm:py-20 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center sm:mb-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Знакомьтесь
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Наша команда
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((p) => (
          <article
            key={p.id}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-blue-50">
              <div
                className="absolute inset-0 flex items-center justify-center text-4xl font-semibold text-blue-600"
                aria-hidden="true"
              >
                {p.name.slice(0, 1)}
              </div>
              <img
                src={p.img}
                alt={p.name}
                className="absolute inset-0 h-full w-full object-cover object-top"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <h3 className="text-xl font-semibold text-slate-900">{p.name}</h3>
              <p className="mt-1 text-sm font-semibold text-blue-600">
                {p.specialty}
              </p>
              <p className="mt-auto pt-3 text-sm text-slate-500">{p.role}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Team;

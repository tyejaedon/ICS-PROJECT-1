// Components/Services.js
import React from 'react';


const services = [
  { emoji: '🗑️', title: 'Trash Point Collection', description: 'Identify and manage community waste points.' },
  { emoji: '🤝', title: 'Community Building', description: 'Unite neighbors in eco-friendly efforts.' },
  { emoji: '🧭', title: 'Community Leader', description: 'Enable leaders to coordinate local cleanups.' },
  { emoji: '♻️', title: 'Waste Sorting', description: 'Educate and guide sorting of recyclable waste.' },
  { emoji: '📍', title: 'Geo-location', description: 'Track and report waste via GPS mapping.' },
  { emoji: '📊', title: 'Accountability', description: 'Keep cleanup teams accountable and transparent.' },
  { emoji: '📈', title: 'Statistical Report', description: 'View progress and impact metrics in real-time.' },
];

const Services = () => {
  return (
    <section className="services-section">
      <h2 className="services-heading">Our Key Services</h2>
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-tile">
            <div className="service-emoji">{service.emoji}</div>
            <h3 className="service-title">{service.title}</h3>
            <p className="service-description">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;

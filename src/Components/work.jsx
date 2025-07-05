// HowItWorks.js
import React from "react";


const HowItWorks = ({ steps }) => {
  return (
    <section className="how-it-works">
      {steps.map((step, index) => (
        <div key={index} className="how-it-works-tile">
          <img src={step.image} alt={step.title} className="how-it-works-image" />
          <div className="how-it-works-content">
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default HowItWorks;

// FILE: src/app/components/home/Hero.js
'use client';

export default function Hero({ content = {} }) {
  return (
    <section id="home" className="relative section-padding pt-32 pb-20 overflow-hidden bg-gray-900 text-gray-100">
      <div className="absolute inset-0 bg-grid-dark"></div>
      <div className="relative content-container container-padding text-center">
        <h1 className="text-hero font-heading mb-6">
          {content.hero?.title || "Generated $20 million in sales."}
        </h1>
        <p className="text-body text-gray-300 mb-8 max-w-2xl mx-auto">
          {content.hero?.content || "Training sales reps to make millions a year. Getting that promotion and new high-paying clients is easy."}
        </p>
        <button className="btn-primary text-button px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-shadow">
          {content.hero_cta?.title || "FASTEST way to earn freedom NOW"}
        </button>
      </div>
    </section>
  );
}

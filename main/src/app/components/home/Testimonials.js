// FILE: src/app/components/home/Testimonials.js
'use client';

import { Star } from 'lucide-react';

export default function Testimonials({ testimonials }) {
  // Map client names to their photos
  const getClientPhoto = (name) => {
    const clientPhotos = {
      'Lauryn Cassells': '/lc.jpeg',
      'Garvit Chaudhary': '/gc.jpeg', 
      'Akshay Sharma': '/as.jpeg'
    };
    return clientPhotos[name] || null;
  };

  return (
    <section id="testimonials" className="section-padding bg-gray-900 text-gray-100">
      <div className="content-container container-padding">
        <h2 className="text-section font-heading text-center mb-12">What Our Clients Say</h2>
        
        {testimonials.length === 0 ? (
          <div className="text-center text-gray-400">
            No testimonials available at the moment.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="card-ui p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-body mb-6 text-gray-600 dark:text-gray-300">
                  "{testimonial.review_text || testimonial.content}"
                </p>
                <div className="flex items-center space-x-4">
                  {getClientPhoto(testimonial.customer_name || testimonial.name) ? (
                    <img 
                      src={getClientPhoto(testimonial.customer_name || testimonial.name)} 
                      alt={testimonial.customer_name || testimonial.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 dark:border-yellow-400"
                      loading="lazy"
                      width="48"
                      height="48"
                    />
                  ) : testimonial.image_url ? (
                    <img 
                      src={testimonial.image_url} 
                      alt={testimonial.customer_name || testimonial.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 dark:border-yellow-400"
                      loading="lazy"
                      width="48"
                      height="48"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {(testimonial.customer_name || testimonial.name)?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-blue-600 dark:text-yellow-400">
                      {testimonial.customer_name || testimonial.name}
                    </div>
                    {testimonial.position && testimonial.company && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.position} at {testimonial.company}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

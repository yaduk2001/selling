// FILE: src/app/components/home/About.js
'use client';

export default function About({ content }) {
  return (
    <section id="about" className="section-padding bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
      <div className="content-container container-padding">
        <h2 className="text-section font-heading text-center mb-8">
          {content?.about?.title || "About Shrey"}
        </h2>
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-5xl mx-auto">
          {/* Shrey's Photo */}
          <div className="flex-shrink-0">
            <img 
              src="/shrey.jpeg" 
              alt="Shrey - Sales Coach" 
              className="w-64 h-64 lg:w-80 lg:h-80 rounded-full object-cover shadow-xl border-4 border-blue-200 dark:border-yellow-400"
              loading="lazy"
              width="320"
              height="320"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 text-body space-y-6 text-gray-600 dark:text-gray-300">
            {content?.about?.content ? (
              content.about.content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <>
                <p>I have been selling and teaching sales for over a decade. My industry of choice was the hardest industry to sell in — selling charities on a monthly subscription both on the streets and in shopping centres. Getting people to commit to monthly donations for charities they had never heard of, from a stranger they had never met before, forced me to master the real art of sales.</p>
                
                <p>I realised that sales psychology goes way deeper than what has been taught to us through different platforms and books. I was required to put on a smile, have an amazing attitude and let my personality shine, which helped me turn customers into friends instantaneously. I learnt that I can make people WANT to buy from me.</p>
                
                <p>You don't have to go through a million rejections to be great at sales because I have already done that, so now I can help serve you. Go ahead and get that book and coaching class because you are about to save 1000's of hours in figuring out what actually works!</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

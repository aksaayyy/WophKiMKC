export default function About() {
  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl text-text-light dark:text-text-dark">About Us</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-subtle-light dark:text-subtle-dark">
            At Content Pilot, we&apos;re on a mission to revolutionize content creation. Our innovative AI-powered tool empowers creators to produce high-quality videos efficiently, saving time and maximizing impact.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background-light dark:bg-background-dark/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-text-light dark:text-text-dark">Our Mission</h2>
            <p className="text-base text-subtle-light dark:text-subtle-dark text-center leading-relaxed">
              Our mission is to empower content creators with cutting-edge AI tools that streamline video production. We believe in making professional-quality content accessible to everyone, from individual creators to large enterprises. By leveraging advanced algorithms for smart clip selection, format optimization, and batch processing, we help users focus on creativity while we handle the technical heavy lifting.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-text-light dark:text-text-dark">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 rounded-xl border border-subtle-light dark:border-subtle-dark p-6 bg-background-light dark:bg-subtle-dark/20">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                  <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold">Smart Clip Selection</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark">AI analyzes your footage to automatically select the most engaging clips.</p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-subtle-light dark:border-subtle-dark p-6 bg-background-light dark:bg-subtle-dark/20">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold">Vertical Format (9:16)</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark">Optimize videos for mobile platforms with automatic vertical formatting.</p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-subtle-light dark:border-subtle-dark p-6 bg-background-light dark:bg-subtle-dark/20">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                  <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold">Batch Processing</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark">Handle multiple videos at once for maximum efficiency.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background-light dark:bg-subtle-dark/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-text-light dark:text-text-dark">Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-primary mx-auto mb-4">
                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,136H40V56H216V176Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold">Increased Productivity</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark mt-2">Produce more content in less time with automated processes.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-primary mx-auto mb-4">
                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold">Improved Content Quality</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark mt-2">Create professional-grade videos that engage your audience.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-primary mx-auto mb-4">
                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold">Enhanced Creativity</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark mt-2">Focus on storytelling while AI handles technical optimizations.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-text-light dark:text-text-dark">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 mb-4 rounded-full overflow-hidden">
                <img alt="Alex Johnson" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/example1" />
                </div>
              <h3 className="text-lg font-bold">Alex Johnson</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark">CEO & Founder</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 mb-4 rounded-full overflow-hidden">
                <img alt="Maria Garcia" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/example2" />
                </div>
              <h3 className="text-lg font-bold">Maria Garcia</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark">CTO</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 mb-4 rounded-full overflow-hidden">
                <img alt="James Chen" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/example3" />
                </div>
              <h3 className="text-lg font-bold">James Chen</h3>
              <p className="text-sm text-subtle-light dark:text-subtle-dark">Head of AI</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background-light dark:bg-subtle-dark/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold sm:text-4xl text-text-light dark:text-text-dark">Ready to Transform Your Content Creation?</h2>
            <p className="mt-4 text-subtle-light dark:text-subtle-dark">Join thousands of creators who are already benefiting from Content Pilot. Start your free trial today!</p>
            <button className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              Get Started
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

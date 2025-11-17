export default function Home() {
  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl text-text-light">
            Welcome to Content Pilot
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-text-light">
            Revolutionize your content creation with our AI-powered tool. Create high-quality videos effortlessly with features like smart clip selection, vertical format optimization, and batch processing.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-text-light">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 rounded-xl border border-subtle-light p-6 bg-background-light">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                  <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-light">Smart Clip Selection</h3>
              <p className="text-sm text-text-light">Automatically select the best clips from your footage for optimal content.</p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-subtle-light p-6 bg-background-light">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-light">Vertical Format (9:16)</h3>
              <p className="text-sm text-text-light">Optimize your videos for mobile viewing with perfect vertical formatting.</p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-subtle-light p-6 bg-background-light">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                <svg fill="currentColor" height="28" viewBox="0 0 256 256" width="28" xmlns="http://www.w3.org/2000/svg">
                  <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-light">Batch Processing</h3>
              <p className="text-sm text-text-light">Process multiple videos simultaneously to save time and increase efficiency.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center text-text-light">Getting Started</h2>
          <div className="max-w-3xl mx-auto">
            <ol className="list-decimal list-inside space-y-4 text-base text-text-light">
              <li><strong>Sign Up:</strong> Create your account to access all features.</li>
              <li><strong>Upload Content:</strong> Import your videos and select your desired settings.</li>
              <li><strong>Choose Features:</strong> Enable smart selection, vertical format, and other options.</li>
              <li><strong>Process and Download:</strong> Let our AI work its magic and download your optimized content.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold sm:text-4xl text-text-light">Ready to Get Started?</h2>
            <p className="mt-4 text-text-light">Join thousands of creators who are transforming their content with Content Pilot.</p>
            <button className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 text-base font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              Get Started Now
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

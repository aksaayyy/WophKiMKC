'use client';

import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl text-text-light dark:text-text-dark">Contact Us</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-subtle-light dark:text-subtle-dark">
            Have questions about Content Pilot? We&apos;re here to help. Reach out to our team for support, partnerships, or any inquiries.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background-light dark:bg-subtle-dark/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-8 text-text-light dark:text-text-dark">Get in Touch</h2>
                <p className="text-base text-subtle-light dark:text-subtle-dark mb-8">
                  Whether you need technical support, have feedback, or want to explore partnership opportunities, our team is ready to assist you.
                </p>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.11-.14.22-.31.33-.45a16,16,0,0,0,1.4-15.17l-.06-.13L97.39,33.63a16,16,0,0,0-16.53-9.92A16.14,16.14,0,0,0,64,40.24L48,128l119.9,53.73a16,16,0,0,0,21.84-7.28,16.12,16.12,0,0,0-7.37-21Z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Phone</h3>
                      <p className="text-subtle-light dark:text-subtle-dark">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64L128,133.57,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19Z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Email</h3>
                      <p className="text-subtle-light dark:text-subtle-dark">support@contentpilot.online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,1,0,88,88A88.1,88.1,0,0,0,128,16Zm0,160a72,72,0,1,1,72-72A72.08,72.08,0,0,1,128,176Z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Address</h3>
                      <p className="text-subtle-light dark:text-subtle-dark">123 Innovation Drive<br />San Francisco, CA 94105</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-8 text-text-light dark:text-text-dark">Send us a Message</h2>
                {submitted ? (
                  <p className="text-green-600 mb-4">Message sent successfully!</p>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                      <input type="text" id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border border-subtle-light dark:border-subtle-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent">
                      </input>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                      <input type="email" id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="w-full px-3 py-2 border border-subtle-light dark:border-subtle-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent">
                      </input>
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                      <input type="text" id="subject" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required className="w-full px-3 py-2 border border-subtle-light dark:border-subtle-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent">
                      </input>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                      <textarea id="message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} rows={4} required className="w-full px-3 py-2 border border-subtle-light dark:border-subtle-dark rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                    </div>
                    <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

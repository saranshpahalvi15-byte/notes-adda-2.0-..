import React, { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          Get in Touch
        </h1>
        <p className="mt-4 text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Have questions about our notes or need help with a purchase? We're here to help you succeed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">Email Us</h4>
                  <p className="text-gray-500 dark:text-gray-400">saransh1860@gmail.com</p>
                  <p className="text-xs text-indigo-600 font-medium mt-1">24-hour response time</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-green-50 dark:bg-green-900/40 rounded-2xl flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">WhatsApp Support</h4>
                  <a href="https://whatsapp.com/channel/0029Vb8UtXW3QxRvaMKkyM19" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    Join Our Support Channel
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">Our Location</h4>
                  <p className="text-gray-500 dark:text-gray-400">Available across all major cities in India via digital delivery.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-8 text-white">
            <h3 className="text-xl font-bold mb-4">Are you an educator?</h3>
            <p className="text-indigo-100 mb-6 leading-relaxed">
              We are always looking for subject matter experts to help us create high-quality content. If you have clear, handwritten notes for Class 9-12, reach out!
            </p>
            <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-50 transition-all">
              Partnership Inquiry
            </button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-gray-900 p-8 md:p-12 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden relative">
          {submitted ? (
            <div className="text-center py-12 animate-in zoom-in duration-500">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-4">Message Sent!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Thank you for reaching out. A technician from our academic support team will contact you shortly.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-indigo-600 font-bold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">FullName</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input 
                    required
                    type="email" 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                <select className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all">
                  <option>Note Purchase Inquiry</option>
                  <option>Technical Support</option>
                  <option>Bug Report</option>
                  <option>Partner Engagement</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your Message</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all" 
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <Send className="h-5 w-5" />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

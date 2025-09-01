'use client';

import React, { useState } from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Guitar Lessons Inquiry',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message) {
      setSubmitStatus('error');
      setSubmitMessage('Please fill in your name and message.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Message sent successfully! I typically respond within 24-48 hours.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: 'Guitar Lessons Inquiry',
          message: ''
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <React.Fragment>
      <Navigation />
      <main className="min-h-screen bg-amber-900 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-amber-50 text-center mb-8">
            Get In Touch
          </h1>
          <p className="text-amber-50 text-center text-lg mb-12">
            Ready to start your guitar journey or have questions about my music? Let's connect!
          </p>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-stone-400 rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-amber-900 mb-6">Send Me a Message</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl bg-green-800 text-amber-50">
                  <p className="font-medium">Message sent successfully!</p>
                  <p className="text-sm mt-1">{submitMessage}</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 rounded-xl bg-red-700 text-amber-50">
                  <p className="font-medium">Error sending message</p>
                  <p className="text-sm mt-1">{submitMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block font-medium mb-2 text-amber-900">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-900 bg-amber-50 text-amber-900 focus:outline-none"
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block font-medium mb-2 text-amber-900">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-900 bg-amber-50 text-amber-900 focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block font-medium mb-2 text-amber-900">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-900 bg-amber-50 text-amber-900 focus:outline-none"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block font-medium mb-2 text-amber-900">
                    What's this about?
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-900 bg-amber-50 text-amber-900 focus:outline-none"
                  >
                    <option value="Guitar Lessons Inquiry">Guitar Lessons Inquiry</option>
                    <option value="Music Collaboration">Music Collaboration</option>
                    <option value="YouTube Channel Question">YouTube Channel Question</option>
                    <option value="Performance Booking">Performance Booking</option>
                    <option value="General Question">General Question</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block font-medium mb-2 text-amber-900">
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-900 bg-amber-50 text-amber-900 focus:outline-none resize-none"
                    placeholder="Tell me about your musical goals, experience level, availability for lessons, or any questions you have..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-green-800 text-amber-50"
                >
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>

              <p className="text-sm mt-4 text-center text-amber-900 opacity-70">
                * Email and phone are optional, but recommended for faster responses
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-stone-400 rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-amber-900 mb-6">Location</h2>
                <div>
                  <p className="text-amber-900">Near Kansas City Missouri</p>
                </div>
              </div>

              <div className="bg-stone-400 rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-amber-900 mb-6">Why Contact Me?</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">Guitar Lessons</h3>
                    <p className="text-amber-900 text-sm">Learn beginner/intermediate guitar, strumming, fingerstyle and song writing</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">Music Collaboration</h3>
                    <p className="text-amber-900 text-sm">Discuss music projects and performances</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">General Questions</h3>
                    <p className="text-amber-900 text-sm">Ask about my music or YouTube channel</p>
                  </div>
                </div>
              </div>

              <div className="bg-stone-400 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-amber-900 mb-4">Response Time</h3>
                <p className="leading-relaxed text-amber-900">
                  I typically respond to messages within 24-48 hours. For lesson inquiries, 
                  I'll get back to you with available time slots and we can schedule a brief 
                  consultation to discuss your musical goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer backgroundColor="bg-amber-800" />
    </React.Fragment>
  );
}

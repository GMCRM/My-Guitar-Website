'use client';

import { useState } from 'react';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, MusicalNoteIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Guitar Lessons Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: ''
  });

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function (allows various formats)
  const isValidPhone = (phone: string): boolean => {
    // Remove all non-digit characters for validation
    const phoneDigits = phone.replace(/\D/g, '');
    // Must be 10-11 digits (US/Canada format)
    return phoneDigits.length >= 10 && phoneDigits.length <= 11;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation for email and phone
    if (name === 'email' && value) {
      if (!isValidEmail(value)) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    }

    if (name === 'phone' && value) {
      if (!isValidPhone(value)) {
        setValidationErrors(prev => ({
          ...prev,
          phone: 'Please enter a valid phone number (10-11 digits)'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          phone: ''
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset validation errors
    setValidationErrors({ email: '', phone: '' });
    
    // Check required fields
    if (!formData.name || !formData.message) {
      setSubmitStatus('error');
      setSubmitMessage('Please fill in your name and message.');
      return;
    }

    // Validate email if provided
    if (formData.email && !isValidEmail(formData.email)) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter a valid email address.');
      setValidationErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
      return;
    }

    // Validate phone if provided
    if (formData.phone && !isValidPhone(formData.phone)) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter a valid phone number (10-11 digits).');
      setValidationErrors(prev => ({
        ...prev,
        phone: 'Please enter a valid phone number (10-11 digits)'
      }));
      return;
    }

    // Require either email or phone
    if (!formData.email && !formData.phone) {
      setSubmitStatus('error');
      setSubmitMessage('Please provide either a valid email address or phone number so I can respond to you.');
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
        setSubmitMessage(result.message);
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

  const contactReasons = [
    {
      title: 'Guitar Lessons',
      description: 'Learn beginner/intermediate guitar, strumming, fingerstyle and song writing',
      icon: MusicalNoteIcon,
      bgColor: '#2C5530' // Green
    },
    {
      title: 'Music Collaboration',
      description: 'Discuss music projects, performances, or collaborations',
      icon: AcademicCapIcon,
      bgColor: '#BC6A1B' // Orange
    },
    {
      title: 'General Inquiries',
      description: 'Questions about my music, YouTube channel, or other topics',
      icon: EnvelopeIcon,
      bgColor: '#535925' // Dark green
    }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen" style={{ backgroundColor: '#6D4C3D' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#F4EBD9' }}>
              Get In Touch
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#F4EBD9' }}>
              Ready to start your guitar journey or have questions about my music? 
              I'd love to hear from you! Whether you're interested in private lessons, 
              want to collaborate, or just want to say hello, don't hesitate to reach out.
            </p>
          </div>

          {/* Contact Reasons */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactReasons.map((reason, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: reason.bgColor }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F4EBD9' }}>
                  <reason.icon className="h-8 w-8" style={{ color: reason.bgColor }} />
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#F4EBD9' }}>{reason.title}</h3>
                <p style={{ color: '#F4EBD9', opacity: 0.9 }}>{reason.description}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="rounded-3xl p-8" style={{ backgroundColor: '#A39A92' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#6D4C3D' }}>Send Me a Message</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#2C5530', color: '#F4EBD9' }}>
                  <p className="font-medium">Message sent successfully!</p>
                  <p className="text-sm mt-1">{submitMessage}</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#8B4513', color: '#F4EBD9' }}>
                  <p className="font-medium">Error sending message</p>
                  <p className="text-sm mt-1">{submitMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block font-medium mb-2" style={{ color: '#6D4C3D' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100"
                    style={{ 
                      backgroundColor: '#F4EBD9', 
                      color: '#6D4C3D',
                      borderColor: '#6D4C3D'
                    }}
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block font-medium mb-2" style={{ color: '#6D4C3D' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 ${
                        validationErrors.email ? 'border-red-500' : ''
                      }`}
                      style={{ 
                        backgroundColor: '#F4EBD9', 
                        color: '#6D4C3D',
                        borderColor: validationErrors.email ? '#DC2626' : '#6D4C3D'
                      }}
                      placeholder="your@email.com"
                    />
                    {validationErrors.email && (
                      <p className="text-sm mt-1" style={{ color: '#DC2626' }}>
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block font-medium mb-2" style={{ color: '#6D4C3D' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 ${
                        validationErrors.phone ? 'border-red-500' : ''
                      }`}
                      style={{ 
                        backgroundColor: '#F4EBD9', 
                        color: '#6D4C3D',
                        borderColor: validationErrors.phone ? '#DC2626' : '#6D4C3D'
                      }}
                      placeholder="(555) 123-4567"
                    />
                    {validationErrors.phone && (
                      <p className="text-sm mt-1" style={{ color: '#DC2626' }}>
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block font-medium mb-2" style={{ color: '#6D4C3D' }}>
                    What's this about?
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100"
                    style={{ 
                      backgroundColor: '#F4EBD9', 
                      color: '#6D4C3D',
                      borderColor: '#6D4C3D'
                    }}
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
                  <label htmlFor="message" className="block font-medium mb-2" style={{ color: '#6D4C3D' }}>
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-opacity-100 resize-none"
                    style={{ 
                      backgroundColor: '#F4EBD9', 
                      color: '#6D4C3D',
                      borderColor: '#6D4C3D'
                    }}
                    placeholder="Tell me about your musical goals, experience level, availability for lessons, or any questions you have..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ 
                    backgroundColor: '#2C5530',
                    color: '#F4EBD9'
                  }}
                >
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>

              <p className="text-sm mt-4 text-center" style={{ color: '#6D4C3D', opacity: 0.7 }}>
                * Email OR phone number required for response
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Direct Contact */}
              <div className="rounded-3xl p-8" style={{ backgroundColor: '#A39A92' }}>
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#6D4C3D' }}>Direct Contact</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2C5530' }}>
                      <EnvelopeIcon className="h-6 w-6" style={{ color: '#F4EBD9' }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#6D4C3D' }}>Email</p>
                      <a href="mailto:grantmatai@gmail.com" className="hover:opacity-80 transition-opacity" style={{ color: '#6D4C3D' }}>
                        grantmatai@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BC6A1B' }}>
                      <PhoneIcon className="h-6 w-6" style={{ color: '#F4EBD9' }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#6D4C3D' }}>Phone</p>
                      <a href="tel:425-595-9337" className="hover:opacity-80 transition-opacity" style={{ color: '#6D4C3D' }}>
                        (425) 595-9337
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#535925' }}>
                      <MapPinIcon className="h-6 w-6" style={{ color: '#F4EBD9' }} />
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#6D4C3D' }}>Location</p>
                      <p style={{ color: '#6D4C3D' }}>Washington State</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="rounded-3xl p-8" style={{ backgroundColor: '#A39A92' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#6D4C3D' }}>Response Time</h3>
                <p className="leading-relaxed" style={{ color: '#6D4C3D' }}>
                  I typically respond to messages within 24-48 hours. For lesson inquiries, 
                  I'll get back to you with available time slots and we can schedule a brief 
                  consultation to discuss your musical goals.
                </p>
              </div>

              {/* YouTube Channel */}
              <div className="rounded-3xl p-8" style={{ backgroundColor: '#A39A92' }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#6D4C3D' }}>Check Out My Music</h3>
                <p className="mb-4" style={{ color: '#6D4C3D' }}>
                  While you're here, feel free to explore my YouTube channel to get a sense 
                  of my playing style and teaching approach.
                </p>
                <a 
                  href="https://www.youtube.com/channel/UCzwxT1G7fKteEkiSge9Gk-w"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 font-medium rounded-xl transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: '#DC2626',
                    color: '#F4EBD9'
                  }}
                >
                  <MusicalNoteIcon className="h-5 w-5 mr-2" />
                  Visit YouTube Channel
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

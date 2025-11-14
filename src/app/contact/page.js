//src/app/contact/page.js
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Send, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import EventTypeSelect from '@/components/EventTypeSelect';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [submitted, setSubmitted] = useState(null); // { referenceId, email }
  const [eventType, setEventType] = useState('');
  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm();

  // --- Simple honeypot for bots ---
  const hp = watch('website'); // if filled, we silently drop the submit

  // Mock location data
  const locationData = {
    'United States': {
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
      'New York': ['New York City', 'Albany', 'Buffalo', 'Rochester'],
      'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
      'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville']
    },
    'Canada': {
      'Ontario': ['Toronto', 'Ottawa', 'Hamilton', 'London'],
      'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau'],
      'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby']
    }
  };

  const timeZones = [
    'PST (Pacific Standard Time)',
    'MST (Mountain Standard Time)',
    'CST (Central Standard Time)',
    'EST (Eastern Standard Time)',
    'GMT (Greenwich Mean Time)',
    'IST (India Standard Time)'
  ];

  useEffect(() => {
    setCountries(Object.keys(locationData));
  }, []);

  // Auto-select a friendly time zone when possible
  useEffect(() => {
    try {
      const iana = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const map = [
        [/America\/(Los_Angeles|Vancouver)/, 'PST (Pacific Standard Time)'],
        [/America\/(Denver|Edmonton|Phoenix)/, 'MST (Mountain Standard Time)'],
        [/America\/(Chicago|Winnipeg|Mexico_City)/, 'CST (Central Standard Time)'],
        [/America\/(New_York|Toronto)/, 'EST (Eastern Standard Time)'],
        [/Europe\/.*/, 'GMT (Greenwich Mean Time)'],
        [/Asia\/Kolkata/, 'IST (India Standard Time)']
      ];
      const found = map.find(([re]) => re.test(iana))?.[1];
      if (found) setValue('timeZone', found, { shouldValidate: true });
    } catch {}
  }, [setValue]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setSelectedState('');
    setValue('state', '');
    setValue('city', '');
    setStates(country && locationData[country] ? Object.keys(locationData[country]) : []);
    setCities([]);
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    setValue('city', '');
    setCities(state && locationData[selectedCountry]?.[state] ? locationData[selectedCountry][state] : []);
  };

  const onSubmit = async (data) => {
    // Honeypot: ignore obvious bots
    if (hp) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      let result = {};
      try { result = JSON.parse(text); } catch {}

      if (!response.ok || result?.success === false) {
        toast.error(result?.message || text || 'Failed to send inquiry. Please try again.', {
          duration: 6000, style: { background: '#EF4444', color: 'white' },
        });
        return;
      }

      setSubmitted({ referenceId: result?.referenceId, email: data.email });
      reset();
      setEventType('');
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Network error. Please check your connection and try again.', {
        duration: 6000, style: { background: '#EF4444', color: 'white' },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      {/* No light/gold wash — stick to dark brand */}
      <main className="bg-ink">
        {submitted ? (
          <section className="px-4 pt-14 pb-6">
            {/* Fill the viewport minus header spacing, then center */}
            <div className="min-h-[calc(100vh-220px)] flex items-center justify-center">
              <div className="max-w-lg w-full text-center panel-gold-outline p-6">
                <h2 className="text-2xl font-bold mb-4 text-gold-300">
                  Thanks! We’ve received your inquiry.
                </h2>
                <p className="text-muted font-bold mb-6">
                  Reference ID:{" "}
                  <span className="font-mono font-bold text-gold-300">
                    {submitted.referenceId}
                  </span>
                </p>
                <p className="text-muted font-bold mb-8">
                  Please check your <span className="text-gold-300">Confirmation email</span>.
                </p>
                <p className="text-sm font-bold text-muted">Refresh the page to submit another inquiry.</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Hero */}
            <section className="relative pt-24 pb-2 bg-gradient-to-r from-gray-900 via-gray-900 to-black text-text overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <Mail className="h-16 w-16 text-gold-400 mx-auto mb-6 animate-bounce" />
                <h1 className="text-5xl lg:text-6xl font-bold font-playfair mb-6">Send an Enquiry</h1>
                <p className="text-2xl text-muted max-w-3xl mx-auto mb-8">
                  Ready to capture your special moments? Let&apos;s discuss your vision and create something beautiful together.
                </p>
                <div className="bg-gold-500/10 backdrop-blur-sm border border-gold-500/30 rounded-2xl p-6 max-w-2xl mx-auto">
                  <p className="text-gold-300 text-lg">
                    ✨ We&apos;ll get back to you with a personalized proposal.
                  </p>
                </div>
              </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              {/* Form card */}
              <div className="bg-card rounded-3xl shadow-2xl p-8 lg:p-12 border border-border">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold font-playfair text-gold-300 mb-4">Tell Us About Your Event</h2>
                  <p className="text-muted text-lg">Fill out the form below and we&apos;ll send you a personalized quote along with your unique reference ID.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                  {/* honeypot */}
                  <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} className="hidden" />

                  {/* Personal Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block form-label-lg mb-2">Full Name *</label>
                      <input
                        type="text"
                        {...register('fullName', {
                          required: 'Full name is required',
                          pattern: { value: /^[A-Za-z\s]+$/, message: 'Name can only contain letters' },
                          minLength: { value: 2, message: 'Please enter at least 2 characters' }
                        })}
                        aria-invalid={!!errors.fullName}
                        className={`form-input ${errors.fullName ? 'form-error' : ''}`}
                        placeholder="Your full name"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block form-label-lg mb-2">Email Address *</label>
                      <input
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Please enter a valid email address' }
                        })}
                        aria-invalid={!!errors.email}
                        className={`form-input ${errors.email ? 'form-error' : ''}`}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block form-label-lg mb-2">Contact Number *</label>
                    <div className="flex w-full">
                      <select className="w-28 sm:w-36 md:w-44 lg:w-52 h-12 sm:h-14 text-base border border-border rounded-l-lg rounded-r-none bg-card" defaultValue="+1 (US)">
                        <option>+1 (US)</option>
                        <option>+91 (IN)</option>
                        <option>+44 (UK)</option>
                      </select>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="1234567890"
                        maxLength={10}
                        {...register('contactNumber', {
                          required: 'Contact number is required',
                          validate: (v) => /^\d{10}$/.test(String(v).replace(/\D/g, '')) || 'Phone number must be exactly 10 digits',
                        })}
                        onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                        aria-invalid={!!errors.contactNumber}
                        className={`flex-1 min-w-0 h-12 sm:h-14 text-base sm:text-lg px-4 border border-l-0 border-border bg-card rounded-r-lg rounded-l-none ${errors.contactNumber ? 'form-error' : ''}`}
                      />
                    </div>
                    {errors.contactNumber && (
                      <p className="mt-1 text-sm text-red-600" role="alert">{errors.contactNumber.message}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block form-label-lg mb-2">Country *</label>
                      <select
                        {...register('country', { required: 'Country is required' })}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        aria-invalid={!!errors.country}
                        className={`form-select ${errors.country ? 'form-error' : ''}`}
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                      </select>
                      {errors.country && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" /> {errors.country.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block form-label-lg mb-2">State *</label>
                      <select
                        {...register('state', { required: 'State is required' })}
                        onChange={(e) => handleStateChange(e.target.value)}
                        disabled={!selectedCountry}
                        aria-invalid={!!errors.state}
                        className={`form-select ${errors.state ? 'form-error' : ''} ${!selectedCountry ? 'bg-surface' : ''}`}
                      >
                        <option value="">Select State</option>
                        {states.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" /> {errors.state.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block form-label-lg mb-2">City *</label>
                      <select
                        {...register('city', { required: 'City is required' })}
                        disabled={!selectedState}
                        aria-invalid={!!errors.city}
                        className={`form-select ${errors.city ? 'form-error' : ''} ${!selectedState ? 'bg-surface' : ''}`}
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                      </select>
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" /> {errors.city.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block form-label-lg mb-2">Event Type *</label>
                      <EventTypeSelect
                        value={eventType}
                        onChange={(val) => { setEventType(val); setValue('eventType', val, { shouldValidate: true }); }}
                        required
                      />
                      <input type="hidden" {...register('eventType', { required: 'Event type is required' })} value={eventType} readOnly />
                      {errors.eventType && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          {errors.eventType.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block form-label-lg mb-2">Shoot Duration (hours) *</label>
                      <input
                        type="number"
                        {...register('duration', {
                          required: 'Duration is required',
                          min: { value: 1, message: 'Minimum 1 hour' },
                          max: { value: 24, message: 'Maximum 24 hours' }
                        })}
                        aria-invalid={!!errors.duration}
                        className={`form-input ${errors.duration ? 'form-error' : ''}`}
                        placeholder="Select Duration (1h - 24h)"
                        min="1"
                        max="24"
                      />
                      {errors.duration && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" /> {errors.duration.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Event Date/Time */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block form-label-lg mb-2">Event Date *</label>
                      <input
                        type="date"
                        {...register('eventDate', { required: 'Event date is required' })}
                        min={new Date().toISOString().split('T')[0]}
                        aria-invalid={!!errors.eventDate}
                        className={`form-input ${errors.eventDate ? 'form-error' : ''}`}
                      />
                      {errors.eventDate && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" /> {errors.eventDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block form-label-lg mb-2">Event Time *</label>
                      <input
                        type="time"
                        {...register('eventTime', { required: 'Event time is required' })}
                        aria-invalid={!!errors.eventTime}
                        className={`form-input ${errors.eventTime ? 'form-error' : ''}`}
                      />
                      {errors.eventTime && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" /> {errors.eventTime.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block form-label-lg mb-2">Time Zone *</label>
                      <select
                        {...register('timeZone', { required: 'Time zone is required' })}
                        aria-invalid={!!errors.timeZone}
                        className={`form-select ${errors.timeZone ? 'form-error' : ''}`}
                      >
                        <option value="">Select Time Zone</option>
                        {timeZones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                      {errors.timeZone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                          <AlertCircle className="h-4 w-4 mr-1" /> {errors.timeZone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block form-label-lg mb-2">Tell us about your requirements *</label>
                    <textarea
                      {...register('message', {
                        required: 'Please describe your requirements',
                        minLength: { value: 10, message: 'Please provide more details (minimum 10 characters)' },
                        maxLength: { value: 1000, message: 'Please keep within 1000 characters' }
                      })}
                      rows={6}
                      aria-invalid={!!errors.message}
                      className={`form-textarea ${errors.message ? 'form-error' : ''}`}
                      placeholder="Describe your vision, Style preferences, vibe,
                      must-haves, special moments you want captured, ~120 guests e.t.c."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                        <AlertCircle className="h-4 w-4 mr-1" /> {errors.message.message}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-500 hover:to-gold-600 disabled:from-gray-300 disabled:to-gray-400 text-text font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ink" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* What Happens Next */}
              <div className="mt-12 panel-gold-outline p-8">
                <h3 className="text-2xl md:text-3xl font-bold font-playfair text-gold-300 mb-6">What Happens Next?</h3>
                <div className="space-y-4">
                  {[
                    ['Instant Confirmation', 'You\'ll receive a confirmation with your unique reference ID'],
                    ['Personal Response', 'We\'ll review your requirements and respond within 24 hours'],
                    ['Custom Proposal', 'Receive a personalized quote and timeline for your event'],
                    ['Client Portal Access', 'Get login credentials for your private client dashboard']
                  ].map(([title, copy]) => (
                    <div className="flex items-start space-x-3" key={title}>
                      <CheckCircle className="h-6 w-6 text-gold-400 mt-0.5" />
                      <div>
                        <p className="font-semibold">{title}</p>
                        <p className="text-muted text-sm">{copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

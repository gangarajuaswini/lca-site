//src/components/WhatIDo.js
'use client';
import { useState } from 'react'
import { Heart, Users, Baby, Briefcase, Camera, Star, ArrowRight } from 'lucide-react'
 
export default function WhatIDo() {
  const [activeService, setActiveService] = useState(0)

  const services = [
    { id: 'wedding',  title: 'Wedding Photography',   icon: Heart,
      description: 'Capturing the magic of your special day with timeless elegance and artistic vision.',
      features: ['Full day coverage (8-12 hours)','Engagement session included','High-resolution edited images','Online gallery for sharing','Print release included','Backup photographer available'],
      startingPrice: '$2,500', popular: true },
    { id: 'portrait', title: 'Portrait Sessions',      icon: Users,
      description: 'Individual, couple, and family portraits that showcase your unique personality and connections.',
      features: ['1-2 hour session','Multiple outfit changes','25-50 edited high-res images','Online gallery','Print release','Location of your choice'],
      startingPrice: '$350',  popular: false },
    { id: 'maternity', title: 'Maternity & Newborn',   icon: Baby,
      description: 'Celebrating new life with tender, beautiful images that you\'ll treasure forever.',
      features: ['Maternity and newborn sessions','Props and accessories included','Studio or outdoor options','30-40 edited images','Family involvement welcome','Flexible scheduling'],
      startingPrice: '$450',  popular: false },
    { id: 'commercial', title: 'Commercial Photography', icon: Briefcase,
      description: 'Professional business photography for your brand, products, and corporate needs.',
      features: ['Brand photography','Product photography','Corporate headshots','Event documentation','Commercial licensing','Rush delivery available'],
      startingPrice: '$500',  popular: false },
    { id: 'events',    title: 'Event Photography',     icon: Camera,
      description: 'Documenting your celebrations, parties, and special occasions with energy and style.',
      features: ['Birthday parties','Corporate events','Graduations','Anniversary celebrations','Holiday parties','Custom event packages'],
      startingPrice: '$400',  popular: false }
  ]

  return (
    <section id="services" className="bg-ink pt-4 pb-0 md:pt-3">
      <div className="mt-4 pt-4 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 animate-fadeInUp">
            <div className="flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-gold-500 mr-3" />
              <span className="text-gold-500 font-semibold uppercase tracking-wider text-lg">
                Photography Services
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold font-playfair text-text mb-4">
              What I Do
              <span className="block text-gold-500">Best</span>
            </h2>
            <p className="text-xl text-muted max-w-3xl mx-auto leading-relaxed">
              Specializing in life's most important moments with a variety of photography services tailored to your unique needs.
            </p>
          </div>

          {/* Service Categories */}
          <div className="mb-12">
            <div className="max-w-fit mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {services.map((service, index) => (
                <button
                  key={service.id}
                  onClick={() => setActiveService(index)}
                  className={`inline-flex items-center justify-center space-x-3 px-6 py-3 rounded-full font-medium transition-all duration-300 relative
                    ${activeService === index
                      ? 'bg-gold-500 text-ink shadow-2xl scale-105'
                      : 'border border-gold-500 text-gold-300 hover:bg-gold-500/10'}`
                  }
                >
                  <service.icon className="h-5 w-5" />
                  <span className="text-center">{service.title}</span>
                  {service.popular && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-text text-xs px-2 py-1 rounded-full">
                      Popular
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>


          {/* Active Service Details - Text Only */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 lg:p-12">
              {/* Service Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="p-4 rounded-full bg-gold-500/15 ring-1 ring-gold-500/40">
                    {(() => {
                      const IconComponent = services[activeService].icon
                      return <IconComponent className="h-8 w-8 text-gold-400" />
                    })()}
                  </div>
                  {/* HEADING IN GOLD */}
                  <h3 className="text-4xl font-bold font-playfair text-gold-400">
                    {services[activeService].title}
                  </h3>
                </div>
                <p className="text-xl text-muted leading-relaxed max-w-2xl mx-auto">
                  {services[activeService].description}
                </p>
              </div>

              {/* Features List */}
              <div className="mb-8">
                <h4 className="text-2xl font-semibold text-text mb-6 text-center">What's Included:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {services[activeService].features.map((feature, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-card rounded-lg border border-border text-muted font-medium"
                    >
                    {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/contact"
                  className="max-w-xs w-full sm:w-auto bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-500 hover:to-gold-600 text-text font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
                >
                  Book This Service
                </a>
                <a
                  href="/my-work"
                  className="max-w-xs w-full sm:w-auto bg-transparent border-2 border-gold-500 text-gold-300 hover:bg-gold-500 hover:text-ink font-semibold py-4 px-8 rounded-full transition-all duration-300 text-center flex items-center justify-center space-x-2"
                >
                  <span>View Portfolio</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-ink" />
              </div>
              <h4 className="text-xl font-bold text-text mb-2">Professional Equipment</h4>
              <p className="text-muted leading-relaxed px-6 sm:px-0">Latest cameras, lenses, and lighting equipment for perfect shots</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-ink" />
              </div>
              <h4 className="text-xl font-bold text-text mb-2">Personal Approach</h4>
              <p className="text-muted leading-relaxed px-6 sm:px-0">Every session is tailored to your unique style and preferences</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-ink" />
              </div>
              <h4 className="text-xl font-bold text-text mb-2">Lifetime Memories</h4>
              <p className="text-muted leading-relaxed px-6 sm:px-0">Creating timeless images you'll treasure for generations</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

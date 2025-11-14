//src/components/About.js
'use client';
import { useState, useEffect } from 'react'
import { Camera, Heart, Star, Users, CheckCircle } from 'lucide-react'

export default function About() {
  const [activeTab, setActiveTab] = useState('story')

  const tabs = [
    { id: 'story', label: 'Our Story', icon: Heart },
    { id: 'mission', label: 'Our Mission', icon: Star },
    { id: 'experience', label: 'Experience', icon: Users },
  ]
 
  const achievements = [
    'Professional Photography for 8+ Years',
    'Featured in Wedding Photography Magazine',
    'Over 500 Satisfied Clients Worldwide',
    'Specialized in Destination Weddings',
    'Expert in Both Digital and Film Photography'
  ]

  const tabContent = {
    story: {
      title: "Behind Every Great Photo is a Great Story",
      content: [
        "Welcome to LCA Visual Studios, where passion meets professionalism in the art of photography. Founded with a vision to capture life's most precious moments, we have been serving clients with dedication and creativity for over 8 years.",
        "Our journey began with a simple belief: every moment has a story worth telling. Whether it's the nervous excitement before walking down the aisle, the joy of a baby's first smile, or the quiet intimacy of a couple's embrace, we're here to preserve these memories for generations to come.",
        "What sets us apart is our commitment to understanding each client's unique vision and bringing it to life through our lens."
      ]
    },
    mission: {
      title: "Creating Timeless Memories Through Art",
      content: [
        "Our mission is to provide exceptional photography services that capture not just images, but emotions, stories, and memories that will be treasured for a lifetime.",
        "We believe that great photography is about more than technical skill – it's about connecting with people, understanding their vision, and creating art that reflects their unique story.",
        "Every session is approached with fresh eyes, creative vision, and meticulous attention to detail to ensure that your memories are preserved in the most beautiful way possible."
      ]
    },
    experience: {
      title: "Experience & Expertise",
      content: [
        "Over the years, we've been honored to capture countless special moments and the trust our clients place in us. Each project represents not just our growth as artists, but our commitment to excellence.",
        "From intimate sessions to grand celebrations, our work has been celebrated by clients who trust us with their most precious memories.",
        "We continue to push creative boundaries while maintaining the highest standards of professionalism and client service."
      ]
    }
  }
  return (
    <section id="about" className="home-about-section pt-16 md:pt-20 pb-8 md:pb-10">
      <div className="home-about-wrap">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-gold-500 mr-3" />
            <span className="text-gold-500 font-semibold uppercase tracking-wider text-lg">About LCA Visual Studios</span>
          </div>
          <h2 className="home-about-title">
            Crafting Visual Stories
            <span className="block text-gold-500">Since 2023</span>
          </h2>
          <p className="home-about-lead text-text/90">
            We are passionate photographers dedicated to capturing the authentic beauty and emotion in every moment we document.
          </p>
        </div>

        {/* Centered content (no image column) */}
        <div className="animate-slideInRight">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gold-400 text-text shadow-lg font-bold'
                    : 'bg-surface text-muted hover:bg-surface font-semibold'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6 max-w-5xl lg:max-w-6xl mx-auto text-center px-4 sm:px-6">
            <h3 className="text-3xl font-bold font-playfair text-text">
              {tabContent[activeTab].title}
            </h3>

            <div className="space-y-4">
              {tabContent[activeTab].content.map((paragraph, index) => (
                <p key={index} className="text-muted leading-relaxed text-lg md:text-xl">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Achievements List (only for Experience) */}
            {activeTab === 'experience' && (
              <div className="mt-8">
                <ul className="space-y-3 text-left inline-block">
                  {achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-gold-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-6">
              <a 
                href="/contact"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-text font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span>Let's Work Together</span>
                <Users className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Stats Section (unchanged) */}
        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '300+', label: 'Happy Clients' },
              { number: '1000+', label: 'Photos Delivered' },
              { number: '70+', label: 'Events Covered' },
              { number: '3+', label: 'Years Experience' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl lg:text-4xl font-bold text-gold-500 mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-muted font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
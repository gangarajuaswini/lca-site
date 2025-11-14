//src/components/HowIWork.js
'use client';
import { Calendar, Camera, Edit3, Send, CheckCircle, MessageCircle, Heart, Check } from 'lucide-react'

export default function HowIWork() {
  const steps = [
    {
      id: 1,
      icon: MessageCircle,
      title: "Submit the Contact Form",
      description: "Tell us about your event, style, and expectations so we can tailor the experience.",
      details: [
        "Share your Event (mood, outfits, vibe) and location details",
        "Mention your photography needs and vision",
        "Instant confirmation with your reference ID",
        "We review your enquiry promptly",
      ],
      color: "from-blue-400 to-blue-600"
    },
    {
      id: 2,
      icon: Calendar,
      title: "Callback & Planning",
      description: "We give you a call to refine ideas, confirm locations, and lock the schedule.",
      details: [
        "Discuss ideas, inspiration, and shot priorities",
        "Finalize date, time, and location",
        "Create detailed timeline and shot list",
        "Clear prep guidance before the session",
      ],
      color: "from-green-400 to-green-600"
    },
    {
      id: 3,
      icon: Camera,
      title: "Photography Session",
      description: "Relax and enjoy - We capture authentic moments with direction and care.",
      details: [
        "Professional equipment and backup gear",
        "Natural guidance for poses & candid moments",
        "Multiple looks/outfits if desired",
        "Calm, fun, and stress-free experience"
      ],
      color: "from-gold-$1 to-gold-$1"
    },
    {
      id: 4,
      icon: Edit3,
      title: "Post-Processing",
      description: "We edit the best shots and share a private Customer Dashboard for your feedback.",
      details: [
      "Access a secure gallery in your dashboard",
      "Professional color correction and enhancement",
      "Multiple editing styles available",
      "We apply revisions and update the gallery",
      "Quality control and final review"
      ],
      color: "from-purple-400 to-purple-600"
    },
    {
      id: 5,
      icon: Send,
      title: "Final Delivery",
      description: "Receive your curated collection via private, secure, sharable links.",
      details: [
        "High-resolution downloads via secure link",
        "Web/social-ready versions included",
        "Private digital delivery",
      ],
      color: "from-pink-400 to-pink-600"
    }
  ]

  return (
    <section id="how-i-work" className="hiw-section pt-16 md:pt-20 pb-2 md:pb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fadeInUp">
          <h2 className="hiw-heading leading-tight">
            <span className="text-gold-500">How I Work</span>
            <span className="block text-text mt-1">With You</span>
          </h2>
          <p className="text-xl text-muted max-w-3xl mx-auto leading-relaxed">
            From our first conversation to final delivery, every step is designed to exceed your expectations and create an amazing experience.
          </p>
        </div>
 
        {/* Process Steps - Horizontal Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {steps.map((step, index) => (
            <div 
              key={step.id ?? index}  
              className="group relative mx-3 sm:mx-0"
            >
              {/* GOLD BORDER WRAPPER — thicker on mobile */}
              <div
                className="
                  rounded-[20px]
                  p-[2px] sm:p-[1.5px]
                  bg-[conic-gradient(at_50%_50%,rgba(212,175,55,.9),rgba(212,175,55,.45),rgba(212,175,55,.9))]
                  shadow-[0_0_0_1px_rgba(212,175,55,.35),0_0_22px_rgba(212,175,55,.22)]
                  transition-transform duration-300 hover:-translate-y-2
                  h-full
                "
              >
                {/* INNER CARD — black gradient + gold ring so the edge is always readable */}
                <div
                  className="
                    rounded-[18px] h-full
                    bg-[linear-gradient(135deg,#020305_0%,#0b0c10_55%,#020305_100%)]
                    ring-1 ring-gold-500/45
                    border border-border/20
                    p-7 sm:p-8
                  "
                >
                  {/* header/content stays the same */}
                  <div className="text-center mb-6">
                    <div className="inline-flex p-4 bg-black/30 rounded-full backdrop-blur-sm mb-4 ring-1 ring-gold-500/50 shadow-[0_0_16px_rgba(212,175,55,0.35)]">
                      <step.icon className="h-8 w-8 text-gold-400" />
                    </div>
                    <div className="hiw-step-num text-6xl font-bold mb-2 leading-none">0{step.id}</div>
                    <h3 className="text-2xl font-bold text-text mb-3 font-playfair">{step.title}</h3>
                    {/* small gold separator */}
                    <div aria-hidden className="hiw-sep" />
                    <p className="text-text/90 leading-relaxed mb-6">{step.description}</p>
                  </div>

                  <ul className="space-y-3">
                    {step.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-gold-400 drop-shadow-[0_0_8px_rgba(212,175,55,.45)]" />
                        </span>
                        <span className="text-text/80">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          ))}
        </div>
 
        {/* Bottom CTA */}
        <div className="text-center">
          <div className="glass-card p-8 max-w-2xl mx-auto mb-0">
            <h3 className="text-2xl font-bold text-text mb-4 font-playfair">
              Ready to Start Your Journey with us?
            </h3>
            <p className="text-muted mb-6">
              Let's discuss your vision and create something beautiful together.
            </p>
            <a
              href="/contact"
              className="hiw-cta"
            >
              <Calendar className="h-5 w-5" />
              <span>Get in Touch</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
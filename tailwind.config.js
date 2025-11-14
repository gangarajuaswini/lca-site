// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
      },
      colors: {
        // Core palette
        ink:    '#0b0b0b',   // page background
        surface:'#111315',   // section background
        card:   '#151718',   // cards, elevated surfaces
        border: '#2a2a2a',   // borders / dividers
        text:   '#f3f4f6',   // main text
        muted:  '#c7cdd3',   // secondary text

        // Brand gold
        gold: {
          100: '#f7e7b2',
          200: '#f1d98a',
          300: '#edd072',
          400: '#e6c159',
          500: '#d4af37',   // primary brand gold
          600: '#b88a1f',
          700: '#9a7419',
        },
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(212,175,55,0.30), 0 12px 30px rgba(0,0,0,0.35)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'slide-in-left': 'slideInLeft 0.8s ease-out',
        'slide-in-right': 'slideInRight 0.8s ease-out',
        'floating': 'floating 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

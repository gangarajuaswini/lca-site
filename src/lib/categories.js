// Keep this single source of truth and import it everywhere.
// src/lib/categories.js
// Central list for category options.
// You can override via NEXT_PUBLIC_CATEGORIES="Wedding, Engagement, Family Photos, Portrait, Event"
const fromEnv = (process.env.NEXT_PUBLIC_CATEGORIES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export const CATEGORIES = fromEnv.length
  ? fromEnv
  : [
    'WEDDING',
    'PRE-WEDDING',
    'ENGAGEMENT',
    'COUPLE SHOOT', 
    'MATERNITY',
    'NEW BORN',
    'BIRTHDAY',
    'GRADUATION',
    'GENDER REVEAL',
    'PORTRAITS',
    'FAMILY SHOOT',
    'FASHION',
    'PRODUCT',
    'CORPORATE/PROFESSIONAL',
    'Other Events',
  ]

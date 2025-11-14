'use client';
import { Camera } from 'lucide-react'

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="animate-spin">
            <Camera className="h-16 w-16 text-gold-$1 mx-auto" />
          </div>
          <div className="absolute inset-0 animate-ping">
            <Camera className="h-16 w-16 text-gold-$1/30 mx-auto" />
          </div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-text mb-4 font-playfair">
          LCA Visual Studios
        </h2>
        <p className="text-muted mb-8 loading-dots">
          Preparing your experience
        </p>
        
        {/* Progress Bar */}
        <div className="w-64 mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold-$1 to-gold-$1 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
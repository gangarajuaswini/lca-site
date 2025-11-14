//src/components/Header.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, User, LogOut } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);     // ← NEW
  const router = useRouter();

  // Only read localStorage after mount (client)
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('user_data');
      if (raw) setUser(JSON.parse(raw));
    } catch (err) {
      console.error('Error parsing user data:', err);
      setUser(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    router.push('/');
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'My Work', href: '/my-work' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: '/blog' },
  ];

  // Use a derived flag that is false on SSR/first paint
  const authed = mounted && !!user;
  const authLabel = authed ? (user.role === 'admin' ? 'Admin' : 'Dashboard') : 'Login';
  const authBtnClass = authed
    ? 'bg-gold-500 text-text hover:bg-gold-500 hover:scale-105'
    : (isScrolled
        ? 'bg-gold-500 text-text hover:bg-gold-500 hover:scale-105'
        : 'bg-card/20 text-text hover:bg-card/30 backdrop-blur-sm border border-border/30');

  const handleAuthClick = () => {
    if (authed) {
      router.push(user.role === 'admin' ? '/admin' : '/customer-dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="lca-header fixed w-full top-0 z-50 transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-[40px] w-[40px] md:h-[44px] md:w-[44px] lg:h-[48px] lg:w-[48px] shrink-0">
              <Image
                src="/logo.jpg"
                alt="LCA Visual Studios"
                fill
                className="object-contain"
                priority
              />
              {/* keep the soft gold glow on hover */}
              <div className="absolute -inset-1 rounded-full bg-gold-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-2xl font-bold font-playfair transition-colors duration-300 group-hover:text-gold-300">
              LCA Visual Studios
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="lca-nav hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-medium transition-all duration-300 hover:scale-110 relative group ${
                  isScrolled ? 'text-muted hover:text-gold-300' : 'text-text hover:text-gold-300'
                }`}
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}

            {/* Auth controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAuthClick}
                className="btn-outline flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300"
              >
                <User className="h-4 w-4" />
                <span>{authLabel}</span>
              </button>

              {authed && (
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors duration-300 ${
              isScrolled ? 'text-muted hover:bg-surface' : 'text-text hover:bg-card/20'
            }`}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-card/95 backdrop-blur-md shadow-lg border-t border-border z-50">
            <div className="px-4 py-6 space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-muted hover:text-gold-300 font-medium transition-colors duration-300"
                >
                  {item.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => {
                    handleAuthClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-gold-500 text-text py-3 rounded-full font-medium hover:bg-gold-500 transition-colors duration-300"
                >
                  <User className="h-4 w-4" />
                  <span>{authed ? (user.role === 'admin' ? 'Admin Panel' : 'My Dashboard') : 'Login'}</span>
                </button>

                {authed && (
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 text-red-500 py-2 mt-2 font-medium hover:text-red-400 transition-colors duration-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

// src/app/admin/(dashboard)/layout.js
import { cookies, headers } from 'next/headers'
import Script from 'next/script'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'

export default async function AdminDashboardLayout({ children }) {
  // Gate the dashboard with admin auth (unchanged)
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  let isAdmin = false
  try { isAdmin = jwt.verify(token || '', JWT_SECRET)?.role === 'admin' } catch {}
  if (!isAdmin) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-ink text-text">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r border-border bg-ink h-screen sticky top-0 flex flex-col">
          {/* Brand / Title */}
          <div className="px-6 pt-10 pb-7 font-bold border-b border-border">
            <h1 className="text-xl uppercase tracking-wider text-gold-300/90">Admin Dashboard</h1>
          </div>

{/* Nav */}
<nav id="admin-nav" className="px-4 pt-4 flex-1 space-y-1.5">
  {[
    ['/admin/inbox', 'Inbox'],
    ['/admin/customer-gallery', 'Customer Gallery'],
    ['/admin/public-gallery', 'Public Gallery'],
    ['/admin/home-gallery', 'Home Gallery'],
    ['/admin/client-reviews', 'Client Reviews'],
    ['/admin/blogs', 'Blog'],
  ].map(([href, label]) => (
    <a
      key={href}
      href={href}
      className={[
        // Base pill (tighter)
        'block w-full rounded-xl px-3 py-1.5 leading-tight text-[15px] font-semibold border transition',
        // Normal (gold outline, black background)
        'bg-transparent border-gold-500/40 text-gold-300',
        // Hover effect
        'hover:bg-gold-500 hover:text-ink hover:border-transparent',
        // Nice focus state (optional)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/30'
      ].join(' ')}
    >
      {label}
    </a>
  ))}
</nav>


          {/* Make the current page yellow */}
          <Script id="admin-nav-active" strategy="afterInteractive">{`
            (function () {
              function setActive() {
                var path = location.pathname;
                var links = document.querySelectorAll('#admin-nav a[href]');
                links.forEach(function(a){
                  var href = a.getAttribute('href') || '';
                  var match = path === href || path.indexOf(href + '/') === 0;

                  var normal = ['bg-transparent','border-gold-500/40','text-gold-300'];
                  var active = ['bg-gold-500','text-ink','border-transparent'];

                  if (match) {
                    a.classList.remove.apply(a.classList, normal);
                    a.classList.add.apply(a.classList, active);
                  } else {
                    a.classList.remove.apply(a.classList, active);
                    a.classList.add.apply(a.classList, normal);
                  }
                });
              }
              setActive();
              window.addEventListener('popstate', setActive);
            })();
          `}</Script>

          {/* Logout in sidebar */}
          <div className="px-4 pt-6 pb-24 border-t border-border">
            <LogoutButton className="w-full justify-center" />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 lg:p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

//src/app/admin/(dashboard)/page.js
'use client';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Camera, Users, Mail, Calendar, Settings, 
  BarChart3, FileText, Bell, Search, Filter,
  Plus, Eye, Edit, Trash2, Download
} from 'lucide-react'
 
export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inbox')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      
      if (!token || !userData) {
        router.push('/admin/login')
        return
      }
      
      try {
        const user = JSON.parse(userData)
        if (user.role !== 'admin') {
          router.push('/login')
          return
        }
        setUser(user)
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/admin/login')
        return
      }
      
      setLoading(false)
    }
 
    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    router.push('/admin/login')
  }

  // Mock data
  const stats = [
    { title: 'Total Inquiries', value: '24', change: '+12%', icon: Mail },
    { title: 'Active Projects', value: '8', change: '+5%', icon: Camera },
    { title: 'This Month Revenue', value: '$12,450', change: '+18%', icon: BarChart3 },
    { title: 'New Clients', value: '6', change: '+25%', icon: Users },
  ]

  const inquiries = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      eventType: 'Wedding',
      date: '2025-12-25',
      referenceId: 'LCAMFT4OXB2FBPN',
      status: 'New',
      submittedAt: '2024-09-20'
    },
    {
      id: 2,
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      eventType: 'Portrait Session',
      date: '2024-10-15',
      referenceId: 'LCAMFT7UYYEDFFJ',
      status: 'Responded',
      submittedAt: '2024-09-19'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-$1"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-card shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Camera className="h-8 w-8 text-gold-$1" />
              <h1 className="text-2xl font-bold font-playfair text-muted">
                Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gold-$1 rounded-full flex items-center justify-center">
                  <span className="text-text font-semibold text-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <span className="text-muted font-medium">{user?.name || 'Admin'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-text px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-grmuteday-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <div className="p-3 bg-gold-$1 rounded-full">
                  <stat.icon className="h-6 w-6 text-gold-$1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-card rounded-xl shadow-lg mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'inbox', name: 'Inbox', icon: Mail },
                { id: 'projects', name: 'Projects', icon: Camera },
                { id: 'clients', name: 'Clients', icon: Users },
                { id: 'analytics', name: 'Analytics', icon: BarChart3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-gold-$1 text-gold-$1'
                      : 'border-transparent text-muted hover:text-muted hover:border-border'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'inbox' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-muted">Recent Inquiries</h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                      <input
                        type="text"
                        placeholder="Search inquiries..."
                        className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-gold-$1 focus:border-transparent"
                      />
                    </div>
                    <button className="flex items-center space-x-2 bg-gold-$1 hover:bg-gold-$1 text-text px-4 py-2 rounded-lg transition-colors duration-200">
                      <Filter className="h-4 w-4" />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead className="border-b-2 border-border">
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted">Client</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted">Event</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted">Reference ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((inquiry) => (
                        <tr key={inquiry.id} className="border-b border-border hover:bg-ink">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-muted">{inquiry.name}</div>
                              <div className="text-sm text-muted">{inquiry.email}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-muted">{inquiry.eventType}</td>
                          <td className="py-4 px-4 text-muted">{inquiry.date}</td>
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm bg-surface px-2 py-1 rounded">
                              {inquiry.referenceId}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              inquiry.status === 'New' 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {inquiry.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button className="p-1 text-muted hover:text-blue-600 transition-colors duration-200">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-muted hover:text-green-600 transition-colors duration-200">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-muted hover:text-red-600 transition-colors duration-200">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted mb-2">Projects Management</h3>
                <p className="text-muted">Project management features coming soon...</p>
              </div>
            )}

            {activeTab === 'clients' && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gmutedray-900 mb-2">Client Management</h3>
                <p className="text-muted">Client management features coming soon...</p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted mb-2">Analytics & Reports</h3>
                <p className="text-muted">Analytics dashboard coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Cloud,
  BellRing,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { canAccess } from '@/lib/authUtils'
import Image from 'next/image'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AWS Files', href: '/dashboard/aws-files', icon: Cloud },
  { name: 'Plans', href: '/dashboard/plans', icon: CreditCard },
  // { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  // { name: 'Notifications', href: '/dashboard/notifications', icon: BellRing },
  { name: 'Notification Templates', href: '/dashboard/notification-templates', icon: BellRing },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setUser(user)
        try {
          const idTokenResult = await user.getIdTokenResult()
          setUserRole(idTokenResult.claims.role as string || null)
        } catch (error) {
          console.error('Error fetching user claims:', error)
          setUserRole(null) // Fallback to no role on error
        }
      } else {
        router.replace('/login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!loading && userRole) {
      if (!canAccess(userRole, pathname)) {
        router.replace('/dashboard');
      }
    }
  }, [userRole, pathname, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.replace('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const accessibleNav = navigation.filter(item => canAccess(userRole, item.href));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-full max-w-xs bg-background">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-foreground"
            >
              <X className="h-6 w-6 text-primary-foreground" />
            </Button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Image
                src="/images/parezar_logo.png"
                alt="Parezar Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="ml-3 text-xl font-bold text-foreground">Parezar</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {accessibleNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-border p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex flex-col w-full bg-background border-r border-border">
          <div className="flex items-center h-16 flex-shrink-0 px-4">
            <Image
              src="/images/parezar_logo.png"
              alt="Parezar Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="ml-3 text-xl font-bold text-foreground">Parezar</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {accessibleNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="flex-shrink-0 border-t border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-background shadow-md lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-border text-muted-foreground focus:outline-none lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <Image
                src="/images/parezar_logo.png"
                alt="Parezar Logo"
                width={32}
                height={32}
                className="rounded-lg lg:hidden"
              />
              <span className="ml-2 text-xl font-bold text-foreground self-center lg:hidden">
                Parezar
              </span>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true) // Start with loading true to handle auth state check
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard')
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: any) {
      setError('Failed to sign in. Please check your credentials.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full">
      <div className="absolute inset-0 hidden lg:block">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="/video/01.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>
       <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover lg:hidden"
      >
        <source src="/video/01.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60 lg:hidden" />


      <div className="relative z-10 w-full lg:grid lg:min-h-screen lg:grid-cols-2">
        <div className="flex h-screen items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-6 rounded-lg bg-background/80 p-8 backdrop-blur-sm">
            <div className="grid gap-2 text-center">
              <Image
                src="/images/parezar_logo.png"
                alt="Parezar Logo"
                width={80}
                height={80}
                className="mx-auto mb-4 rounded-lg"
              />
              <h1 className="text-3xl font-bold">Sign in</h1>
              <p className="text-balance text-muted-foreground">
                Enter your email below to sign in to your account
              </p>
            </div>
            <form onSubmit={handleSignIn} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
            {/* <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="underline">
                Sign up
              </Link>
            </div> */}
          </div>
        </div>
        <div className="hidden items-center justify-center lg:flex">
          <div className="p-10 text-center">
            <div className="mb-4">
              <Image
                src="/images/parezar_logo.png"
                alt="Parezar Logo"
                width={120}
                height={120}
                className="mx-auto rounded-lg"
              />
            </div>
            <h2 className="text-4xl font-bold text-white">Welcome to Parezar</h2>
            <p className="mt-4 text-lg text-white/80">
              The future of legal services. Streamlined, efficient, and intelligent.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
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

  const validateForm = (): boolean => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required')
      return false
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    return; //for temporary I won't any Person can register
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/weak-password':
          setError('Password is too weak')
          break
        case 'auth/operation-not-allowed':
          setError('Email/password accounts are not enabled')
          break
        default:
          setError(error.message || 'An error occurred during registration')
      }
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
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/video/01.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full lg:grid lg:min-h-screen lg:grid-cols-2">
        <div className="flex h-screen items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-6 rounded-lg bg-background/80 p-6 backdrop-blur-sm sm:p-8">
            <div className="grid gap-2 text-center">
               <Image
                src="/images/parezar_logo.png"
                alt="Parezar Logo"
                width={80}
                height={80}
                className="mx-auto mb-4 rounded-lg"
              />
              <h1 className="text-3xl font-bold">Create an account</h1>
              <p className="text-balance text-muted-foreground">
                Enter your information to create an account
              </p>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4">
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={!loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden items-center justify-center p-10 text-center lg:flex">
          <div>
            <div className="mb-4 inline-block">
              <Image
                src="/images/parezar_logo.png"
                alt="Parezar Logo"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
            <h2 className="text-4xl font-bold text-white">Join Parezar Today</h2>
            <p className="mt-4 text-lg text-white/80">
              Unlock the future of legal services. Sign up for streamlined, efficient, and intelligent solutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
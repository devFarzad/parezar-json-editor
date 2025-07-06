'use client'

import { useState } from 'react'
import { useTheme } from "next-themes"
import { auth } from '@/lib/firebaseClient'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Palette, Shield, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handlePasswordReset = async () => {
    setLoading(true)
    setPasswordFeedback({ type: '', message: '' })
    try {
      const user = auth.currentUser
      if (user && user.email) {
        await sendPasswordResetEmail(auth, user.email)
        setPasswordFeedback({ type: 'success', message: `A password reset link has been sent to ${user.email}.` })
      } else {
        setPasswordFeedback({ type: 'error', message: 'Could not find a logged-in user with an email address.' })
      }
    } catch (error: any) {
      console.error("Password Reset Error:", error)
      setPasswordFeedback({ type: 'error', message: error.message || 'Failed to send password reset email.' })
    } finally {
      setLoading(false)
      setTimeout(() => setPasswordFeedback({ type: '', message: '' }), 5000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-card-title">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your application preferences and configuration</p>
      </div>

      {passwordFeedback.message && (
        <Alert variant={passwordFeedback.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{passwordFeedback.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select onValueChange={setTheme} defaultValue={theme}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select the theme for the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Change Password</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Click the button below to send a password reset link to your email.
              </p>
              <Button onClick={handlePasswordReset} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Password Reset Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
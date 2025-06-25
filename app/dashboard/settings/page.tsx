'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Bell, Shield, Palette, Database } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: true,
    theme: 'light',
    maxFileSize: 10
  })
  const [success, setSuccess] = useState('')

  const handleSave = () => {
    setSuccess('Settings saved successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your application preferences and configuration</p>
      </div>

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General
            </CardTitle>
            <CardDescription>Basic application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select 
                id="theme"
                className="w-full p-2 border rounded-md"
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="autosave">Auto-save changes</Label>
              <input
                id="autosave"
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => setSettings({...settings, autoSave: e.target.checked})}
                className="h-4 w-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Control how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable notifications</Label>
              <input
                id="notifications"
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                className="h-4 w-4"
              />
            </div>
            <div className="text-sm text-gray-500">
              Get notified about file changes, errors, and system updates
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
            <Button variant="outline" className="w-full">
              Enable Two-Factor Auth
            </Button>
            <div className="text-sm text-gray-500">
              Enhance your account security with additional protection
            </div>
          </CardContent>
        </Card>

        {/* File Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              File Management
            </CardTitle>
            <CardDescription>Configure file handling preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxsize">Maximum file size (MB)</Label>
              <Input
                id="maxsize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                min="1"
                max="100"
              />
            </div>
            <div className="text-sm text-gray-500">
              Set the maximum allowed size for JSON file uploads
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Appearance Customization</h3>
            <p className="text-gray-500">
              Advanced appearance settings will be available here including:
            </p>
            <ul className="text-gray-500 mt-4 space-y-2">
              <li>• Custom color schemes</li>
              <li>• Font size preferences</li>
              <li>• Layout density options</li>
              <li>• Dashboard widget configuration</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Save Settings
        </Button>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddUserModal } from '@/components/ui/add-user-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, UserPlus, Shield, Mail, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { auth } from '@/lib/firebaseClient'

interface User {
  uid: string;
  email: string;
  role: 'admin' | 'operator' | 'cleaner';
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', message: '' })
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      setFeedback({ type: 'error', message: 'Could not load user data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUserAdded = () => {
    setFeedback({ type: 'success', message: 'User added successfully!' })
    fetchUsers() // Refetch the list of users
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000)
  }

  const handleToggleUserStatus = async (user: User) => {
    if (auth.currentUser?.uid === user.uid) {
      setFeedback({ type: 'error', message: 'You cannot disable your own account.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000)
      return;
    }

    setUpdatingUserId(user.uid)
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, isActive: !user.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      setFeedback({ type: 'success', message: `User ${user.isActive ? 'disabled' : 'enabled'} successfully.` });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to update user status.' });
    } finally {
      setUpdatingUserId(null)
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000)
    }
  }

  const adminCount = users.filter(user => user.role === 'admin').length

  return (
    <>
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-card-title">Users</h1>
            <p className="text-muted-foreground mt-2">Manage user accounts and permissions</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 self-end sm:self-auto">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
        
        {feedback.message && (
          <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{users.length}</div>}
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{adminCount}</div>}
              <p className="text-xs text-muted-foreground">With admin access</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Now</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>A list of all users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.uid} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate" title={user.email}>{user.email}</p>
                        <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={updatingUserId === user.uid}
                      >
                        {updatingUserId === user.uid ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isActive ? (
                          'Disable'
                        ) : (
                          'Enable'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  Add a new user to see them listed here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Crown, Shield, Edit, Trash2, Mail, Copy, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

interface TeamMember {
  id: string
  user_id: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joined_at: string
  invited_by: string
}

interface Team {
  id: string
  name: string
  owner_id: string
  member_limit: number
  created_at: string
  members: TeamMember[]
}

export function TeamManager() {
  const { user, session } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor')
  const [copiedInvite, setCopiedInvite] = useState(false)

  useEffect(() => {
    if ((user as any)?.team_id) {
      fetchTeamData()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchTeamData = async () => {
    if (!(user as any)?.team_id || !session) return

    try {
      setLoading(true)
      const response = await fetch(`/api/v1/team/${(user as any).team_id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTeam(data.team)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch team data')
      }
    } catch (err) {
      console.error('Error fetching team:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !team || !session) return

    try {
      const response = await fetch(`/api/v1/team/${team.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      })

      if (response.ok) {
        setInviteEmail('')
        setShowInviteForm(false)
        await fetchTeamData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to invite member')
      }
    } catch (err) {
      console.error('Error inviting member:', err)
      setError('Network error occurred')
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!team || !session) return

    try {
      const response = await fetch(`/api/v1/team/${team.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        await fetchTeamData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update member role')
      }
    } catch (err) {
      console.error('Error updating member role:', err)
      setError('Network error occurred')
    }
  }

  const removeMember = async (memberId: string) => {
    if (!team || !session) return
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(`/api/v1/team/${team.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        await fetchTeamData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to remove member')
      }
    } catch (err) {
      console.error('Error removing member:', err)
      setError('Network error occurred')
    }
  }

  const copyInviteLink = async () => {
    if (!team) return

    const inviteLink = `${window.location.origin}/invite/${team.id}`
    await navigator.clipboard.writeText(inviteLink)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2000)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-400" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-400" />
      case 'editor':
        return <Edit className="w-4 h-4 text-green-400" />
      case 'viewer':
        return <Users className="w-4 h-4 text-gray-400" />
      default:
        return <Users className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'admin':
        return 'bg-blue-500/20 text-blue-400'
      case 'editor':
        return 'bg-green-500/20 text-green-400'
      case 'viewer':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const canManageMembers = team?.members.find(m => m.user_id === user?.id)?.role === 'owner' || 
                          team?.members.find(m => m.user_id === user?.id)?.role === 'admin'

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Card>
    )
  }

  if (!(user as any)?.team_id) {
    return (
      <Card>
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Team Yet</h3>
          <p className="text-white/60 mb-6">
            Create or join a team to collaborate with others
          </p>
          <div className="space-x-3">
            <Button onClick={() => window.location.href = '/team/create'}>
              Create Team
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = '/team/join'}>
              Join Team
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchTeamData}>
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (!team) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-white/60">Team not found</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{team.name}</h2>
            <p className="text-white/60">
              {team.members.length} of {team.member_limit} members
            </p>
          </div>
          
          {canManageMembers && (
            <div className="flex space-x-3">
              <Button onClick={() => setShowInviteForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
              <Button variant="secondary" onClick={copyInviteLink}>
                {copiedInvite ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiedInvite ? 'Copied!' : 'Copy Invite Link'}
              </Button>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{team.members.length}</div>
            <div className="text-white/60 text-sm">Team Members</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">
              {Math.round((team.members.length / team.member_limit) * 100)}%
            </div>
            <div className="text-white/60 text-sm">Capacity Used</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">
              {new Date(team.created_at).toLocaleDateString()}
            </div>
            <div className="text-white/60 text-sm">Created</div>
          </div>
        </div>
      </Card>

      {/* Invite Form */}
      <AnimatePresence>
        {showInviteForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Invite New Member</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    placeholder="colleague@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </Button>
                <Button onClick={inviteMember}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Members */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-6">Team Members</h3>
        
        <div className="space-y-4">
          {team.members.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {member.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-medium">{member.email}</h4>
                    {member.user_id === user?.id && (
                      <span className="text-xs text-primary-400">(You)</span>
                    )}
                  </div>
                  <p className="text-white/60 text-sm">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${getRoleColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  <span className="capitalize">{member.role}</span>
                </div>
                
                {canManageMembers && member.role !== 'owner' && member.user_id !== user?.id && (
                  <div className="flex space-x-2">
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(member.id, e.target.value)}
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
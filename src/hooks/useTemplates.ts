'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

export interface ProcessingTemplate {
  id: string
  name: string
  user_id: string
  team_id?: string
  settings: {
    clip_count: number
    quality_preset: string
    enhancement_level: string
    platform_target?: string
    custom_options: Record<string, any>
  }
  is_shared: boolean
  used_count: number
  created_at: string
  updated_at: string
}

export interface UseTemplatesReturn {
  templates: ProcessingTemplate[]
  loading: boolean
  error: string | null
  createTemplate: (name: string, settings: any) => Promise<ProcessingTemplate | null>
  updateTemplate: (id: string, updates: Partial<ProcessingTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  shareTemplate: (id: string, teamId: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useTemplates(): UseTemplatesReturn {
  const { user, session } = useAuth()
  const [templates, setTemplates] = useState<ProcessingTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!user || !session) {
      setTemplates([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/user/templates', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch templates')
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [user, session])

  const createTemplate = useCallback(async (name: string, settings: any): Promise<ProcessingTemplate | null> => {
    if (!user || !session) {
      setError('User not authenticated')
      return null
    }

    try {
      const response = await fetch('/api/v1/user/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name, settings })
      })

      if (response.ok) {
        const data = await response.json()
        const newTemplate = data.template
        setTemplates(prev => [newTemplate, ...prev])
        return newTemplate
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create template')
        return null
      }
    } catch (err) {
      console.error('Error creating template:', err)
      setError('Network error occurred')
      return null
    }
  }, [user, session])

  const updateTemplate = useCallback(async (id: string, updates: Partial<ProcessingTemplate>) => {
    if (!user || !session) {
      setError('User not authenticated')
      return
    }

    try {
      const response = await fetch(`/api/v1/user/templates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(prev => 
          prev.map(template => 
            template.id === id ? data.template : template
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update template')
      }
    } catch (err) {
      console.error('Error updating template:', err)
      setError('Network error occurred')
    }
  }, [user, session])

  const deleteTemplate = useCallback(async (id: string) => {
    if (!user || !session) {
      setError('User not authenticated')
      return
    }

    try {
      const response = await fetch(`/api/v1/user/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        setTemplates(prev => prev.filter(template => template.id !== id))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete template')
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      setError('Network error occurred')
    }
  }, [user, session])

  const shareTemplate = useCallback(async (id: string, teamId: string) => {
    if (!user || !session) {
      setError('User not authenticated')
      return
    }

    try {
      const response = await fetch(`/api/v1/user/templates/${id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ team_id: teamId })
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(prev => 
          prev.map(template => 
            template.id === id ? data.template : template
          )
        )
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to share template')
      }
    } catch (err) {
      console.error('Error sharing template:', err)
      setError('Network error occurred')
    }
  }, [user, session])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    shareTemplate,
    refetch: fetchTemplates
  }
}
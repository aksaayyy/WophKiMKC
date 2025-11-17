'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Share, Copy, Settings, Save, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTemplates, ProcessingTemplate } from '@/hooks/useTemplates'
import { useAuth } from '@/hooks/useAuth'

interface TemplateManagerProps {
  onTemplateSelect?: (template: ProcessingTemplate) => void
  showActions?: boolean
}

export function TemplateManager({ onTemplateSelect, showActions = true }: TemplateManagerProps) {
  const { user } = useAuth()
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate, shareTemplate } = useTemplates()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ProcessingTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    clip_count: 5,
    quality_preset: 'pro',
    enhancement_level: 'basic',
    platform_target: 'tiktok',
    custom_options: {}
  })

  const handleCreateTemplate = async () => {
    if (!formData.name.trim()) return

    const settings = {
      clip_count: formData.clip_count,
      quality_preset: formData.quality_preset,
      enhancement_level: formData.enhancement_level,
      platform_target: formData.platform_target,
      custom_options: formData.custom_options
    }

    const result = await createTemplate(formData.name, settings)
    if (result) {
      setShowCreateForm(false)
      resetForm()
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    const settings = {
      clip_count: formData.clip_count,
      quality_preset: formData.quality_preset,
      enhancement_level: formData.enhancement_level,
      platform_target: formData.platform_target,
      custom_options: formData.custom_options
    }

    await updateTemplate(editingTemplate.id, {
      name: formData.name,
      settings
    })
    
    setEditingTemplate(null)
    resetForm()
  }

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id)
    }
  }

  const handleShareTemplate = async (id: string) => {
    if (!user?.team_id) {
      alert('You need to be part of a team to share templates')
      return
    }

    await shareTemplate(id, user.team_id)
  }

  const startEditing = (template: ProcessingTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      clip_count: template.settings.clip_count,
      quality_preset: template.settings.quality_preset,
      enhancement_level: template.settings.enhancement_level,
      platform_target: template.settings.platform_target || 'tiktok',
      custom_options: template.settings.custom_options || {}
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      clip_count: 5,
      quality_preset: 'pro',
      enhancement_level: 'basic',
      platform_target: 'tiktok',
      custom_options: {}
    })
  }

  const cancelEditing = () => {
    setEditingTemplate(null)
    setShowCreateForm(false)
    resetForm()
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Processing Templates</h2>
          <p className="text-white/60">Save and reuse your favorite processing settings</p>
        </div>
        
        {showActions && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showCreateForm || editingTemplate) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g., TikTok High Quality"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Platform Target
                  </label>
                  <select
                    value={formData.platform_target}
                    onChange={(e) => setFormData({ ...formData, platform_target: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube Shorts</option>
                    <option value="twitter">Twitter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Quality Preset
                  </label>
                  <select
                    value={formData.quality_preset}
                    onChange={(e) => setFormData({ ...formData, quality_preset: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="social">Social (Fast)</option>
                    <option value="pro">Pro (Balanced)</option>
                    <option value="cinematic">Cinematic (Best)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Enhancement Level
                  </label>
                  <select
                    value={formData.enhancement_level}
                    onChange={(e) => setFormData({ ...formData, enhancement_level: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="none">None</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="cinematic">Cinematic</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">
                    Number of Clips: {formData.clip_count}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.clip_count}
                    onChange={(e) => setFormData({ ...formData, clip_count: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="secondary" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No templates yet</h3>
            <p className="text-white/60 mb-6">
              Create your first template to save time on future projects
            </p>
            {showActions && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Template
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative group cursor-pointer" onClick={() => onTemplateSelect?.(template)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                    <p className="text-white/60 text-sm">
                      Used {template.used_count} times
                    </p>
                  </div>
                  
                  {template.is_shared && (
                    <div className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                      Shared
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Platform:</span>
                    <span className="text-white capitalize">{template.settings.platform_target || 'General'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Quality:</span>
                    <span className="text-white capitalize">{template.settings.quality_preset}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Clips:</span>
                    <span className="text-white">{template.settings.clip_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Enhancement:</span>
                    <span className="text-white capitalize">{template.settings.enhancement_level}</span>
                  </div>
                </div>

                {showActions && (
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(template)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {user?.team_id && !template.is_shared && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShareTemplate(template.id)
                          }}
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTemplate(template.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(JSON.stringify(template.settings, null, 2))
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
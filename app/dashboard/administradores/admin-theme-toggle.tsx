'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { updateAdminThemePermission } from './actions'

interface AdminThemeToggleProps {
  adminId: string
  canChangeTheme: boolean
}

export function AdminThemeToggle({ adminId, canChangeTheme }: AdminThemeToggleProps) {
  const [enabled, setEnabled] = useState(canChangeTheme)
  const [saving, setSaving] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked)
    setSaving(true)
    try {
      await updateAdminThemePermission(adminId, checked)
    } catch (error) {
      console.error('Error updating permission:', error)
      setEnabled(!checked)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Switch 
      checked={enabled} 
      onCheckedChange={handleToggle}
      disabled={saving}
    />
  )
}

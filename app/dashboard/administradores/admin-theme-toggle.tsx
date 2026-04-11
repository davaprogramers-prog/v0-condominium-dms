'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface AdminThemeToggleProps {
  adminId: string
  canChangeTheme: boolean
}

export function AdminThemeToggle({ adminId, canChangeTheme }: AdminThemeToggleProps) {
  const [enabled, setEnabled] = useState(canChangeTheme)
  const [saving, setSaving] = useState(false)

  const handleToggle = async (value: boolean) => {
    setEnabled(value)
    setSaving(true)
    try {
      const response = await fetch('/api/admin/theme-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, canChangeTheme: value })
      })
      const data = await response.json()
      if (!data.success) {
        setEnabled(!value)
      }
    } catch (error) {
      console.error('Error updating permission:', error)
      setEnabled(!value)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => handleToggle(true)}
        disabled={saving}
        className={enabled ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-700"}
      >
        <Check className="h-4 w-4 mr-1" />
        Sí
      </Button>
      <Button
        size="sm"
        onClick={() => handleToggle(false)}
        disabled={saving}
        className={!enabled ? "bg-slate-500 hover:bg-slate-600 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-700"}
      >
        <X className="h-4 w-4 mr-1" />
        No
      </Button>
    </div>
  )
}

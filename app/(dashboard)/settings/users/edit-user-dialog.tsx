'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { updateUser, getCreatableRoles, getAssignableLocations } from './actions'
import { useRouter } from 'next/navigation'

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    userId: string
    email: string
    displayName: string | null
    rolePermissionId: number
    locations: Array<{
      locationId: string
      locationName: string
    }>
  } | null
}

interface Role {
  rolePermissionId: number
  name: string
  description: string
  roleName: string
}

interface Location {
  locationId: string
  locationName: string
  accountId: string
}

export default function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])

  const [roles, setRoles] = useState<Role[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load roles and locations when dialog opens
  useEffect(() => {
    if (open && user) {
      loadRolesAndLocations()
      // Pre-populate form with current user data
      setFullName(user.displayName || '')
      setSelectedRoleId(user.rolePermissionId.toString())
      setSelectedLocationIds(user.locations.map(l => l.locationId))
      setError(null)
    }
  }, [open, user])

  const loadRolesAndLocations = async () => {
    setLoading(true)
    try {
      const [rolesData, locationsData] = await Promise.all([
        getCreatableRoles(),
        getAssignableLocations()
      ])

      setRoles(rolesData)
      setLocations(locationsData)
    } catch (err) {
      console.error('Failed to load roles/locations:', err)
      setError('Failed to load form data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocationIds(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  const handleSelectAllLocations = () => {
    if (selectedLocationIds.length === locations.length) {
      setSelectedLocationIds([])
    } else {
      setSelectedLocationIds(locations.map(l => l.locationId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) return

    // Validation
    if (!selectedRoleId) {
      setError('Please select a role')
      return
    }

    if (selectedLocationIds.length === 0) {
      setError('Please select at least one location')
      return
    }

    setSubmitting(true)

    try {
      // Only send fields that have changed
      const updates: {
        fullName?: string
        rolePermissionId?: number
        locationIds?: string[]
      } = {}

      // Check if name changed
      if (fullName !== (user.displayName || '')) {
        updates.fullName = fullName.trim() || undefined
      }

      // Check if role changed
      if (parseInt(selectedRoleId) !== user.rolePermissionId) {
        updates.rolePermissionId = parseInt(selectedRoleId)
      }

      // Check if locations changed
      const currentLocationIds = user.locations.map(l => l.locationId).sort()
      const newLocationIds = [...selectedLocationIds].sort()
      if (JSON.stringify(currentLocationIds) !== JSON.stringify(newLocationIds)) {
        updates.locationIds = selectedLocationIds
      }

      // If nothing changed, just close
      if (Object.keys(updates).length === 0) {
        onOpenChange(false)
        return
      }

      const result = await updateUser(user.userId, updates)

      if (result.success) {
        onOpenChange(false)
        router.refresh() // Refresh server component to show updated user
      } else {
        setError(result.error || 'Failed to update user')
      }
    } catch (err) {
      console.error('Error updating user:', err)
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information, role, and location access.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (Optional)</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
                disabled={submitting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem
                      key={role.rolePermissionId}
                      value={role.rolePermissionId.toString()}
                    >
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {role.roleName.replace('_', ' ')}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roles.length === 0 && (
                <p className="text-xs text-gray-500">
                  No roles available. You may not have permission to assign any role.
                </p>
              )}
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Locations</Label>
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAllLocations}
                    className="text-xs text-red-600 hover:text-red-700"
                    disabled={submitting}
                  >
                    {selectedLocationIds.length === locations.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                {locations.length === 0 ? (
                  <p className="text-sm text-gray-500">No locations available</p>
                ) : (
                  <div className="space-y-3">
                    {locations.map((location) => (
                      <div key={location.locationId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${location.locationId}`}
                          checked={selectedLocationIds.includes(location.locationId)}
                          onCheckedChange={() => handleLocationToggle(location.locationId)}
                          disabled={submitting}
                        />
                        <label
                          htmlFor={`edit-${location.locationId}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {location.locationName}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedLocationIds.length > 0 && (
                <p className="text-xs text-gray-500">
                  {selectedLocationIds.length} location{selectedLocationIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || roles.length === 0 || locations.length === 0}
                className="bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

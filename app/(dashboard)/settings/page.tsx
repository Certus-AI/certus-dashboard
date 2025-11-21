import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Redirect to user management by default
  redirect('/settings/users')
}

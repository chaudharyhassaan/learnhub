import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/common/PageHeader'
import FormField from '../../components/common/FormField'
import PasswordField from '../../components/common/PasswordField'
import { updatePassword, updateProfile } from '../../services/dashboardService'
import usePageTitle from '../../utils/usePageTitle'
import useDashboardAction from './useDashboardAction'
import './tools.css'

// Profile changes update the session header without reloading the dashboard.
export default function Settings() {
  usePageTitle('Settings')
  const { user, setUser } = useAuth()
  const profile = useDashboardAction()
  const password = useDashboardAction()

  return <div className="lh-tool-page">
    <PageHeader title="Settings" />
    <form className="lh-tool-form" onSubmit={event => {
      event.preventDefault()
      const fields = Object.fromEntries(new FormData(event.currentTarget))
      profile.run(() => updateProfile(fields), 'Profile updated.', data => setUser(data.user))
    }}>
      <h2>Profile</h2>
      <FormField label="Name" name="name" defaultValue={user.name} required minLength={2} maxLength={60} error={profile.fields.name} />
      <FormField label="Headline" name="headline" defaultValue={user.headline} maxLength={80} error={profile.fields.headline} />
      <button className="btn btn-primary" type="submit" disabled={profile.busy}>Save profile</button>
    </form>
    <form className="lh-tool-form" onSubmit={event => {
      event.preventDefault()
      const form = event.currentTarget
      const fields = Object.fromEntries(new FormData(form))
      password.run(() => updatePassword(fields), 'Password updated.', () => form.reset())
    }}>
      <h2>Password</h2>
      <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" required error={password.fields.currentPassword} />
      <PasswordField label="New password" name="newPassword" autoComplete="new-password" required minLength={8}
        hint="Use at least 8 characters with a letter and a number." error={password.fields.newPassword} />
      <button className="btn btn-primary" type="submit" disabled={password.busy}>Change password</button>
    </form>
  </div>
}

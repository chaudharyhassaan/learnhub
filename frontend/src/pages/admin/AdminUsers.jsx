import usePageTitle from '../../utils/usePageTitle'
import { useCallback, useEffect, useState } from 'react'
import ConfirmModal from '../../components/common/ConfirmModal'
import ErrorState from '../../components/common/ErrorState'
import FormField from '../../components/common/FormField'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { deleteUser, getUsers, updateUserRole } from '../../services/adminService'
import { formatDate } from '../../utils/format'
import getErrorMessage from '../../utils/getErrorMessage'
import useHomeData from '../public/useHomeData'
import AdminPagination from './AdminPagination'
import AdminTable from './AdminTable'
import useAdminDelete from './useAdminDelete'
import './admin.css'

const roles = ['admin', 'instructor', 'student']

// A new search resets pagination, while mutations refresh the current results.
export default function AdminUsers() {
  usePageTitle('Users')
  const { user } = useAuth()
  const toast = useToast()
  const [input, setInput] = useState('')
  const [query, setQuery] = useState({ search: '', page: 1 })
  const [changing, setChanging] = useState(false)
  const load = useCallback(() => getUsers(query), [query])
  const result = useHomeData(load)
  const data = result.data

  useEffect(() => {
    if (input.trim() === query.search) return
    const timer = setTimeout(() => setQuery({ search: input.trim(), page: 1 }), 400)
    return () => clearTimeout(timer)
  }, [input, query.search])

  const deletion = useAdminDelete(deleteUser, 'User deleted.', () => {
    if (data?.users.length === 1 && query.page > 1) {
      setQuery(current => current === query ? { ...current, page: current.page - 1 } : current)
    }
    result.retry()
  })

  async function changeRole(account, role) {
    if (account.role === role || changing || account._id === user.id) return
    setChanging(true)
    try {
      await updateUserRole(account._id, role)
      result.retry()
      toast.success('Role updated.')
    } catch (error) {
      toast.error(getErrorMessage(error).message)
    } finally {
      setChanging(false)
    }
  }

  return <div className="lh-admin-page">
    <PageHeader title="Users" action={<FormField label="Search" type="search" value={input}
      onChange={event => setInput(event.target.value)} />} />
    {changing && <p role="status">Updating role...</p>}
    {result.loading && <LoadingState variant="table" />}
    {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
    {data?.users.length === 0 && <EmptyState title="No users match your search."
      message="Clear the search to view all accounts." actionLabel="Clear search"
      onAction={() => { setInput(''); setQuery({ search: '', page: 1 }) }} />}
    {data?.users.length > 0 && <AdminTable label="Users" columns={['Name', 'Email', 'Role', 'Joined', 'Actions']}>
      {data.users.map(account => {
        const isSelf = account._id === user.id
        return <tr key={account._id}>
          <td>{account.name}</td><td>{account.email}</td>
          <td><select className="form-select lh-admin-role" aria-label={`Role for ${account.email}`}
            value={account.role} disabled={isSelf || changing}
            onChange={event => changeRole(account, event.target.value)}>
            {roles.map(role => <option key={role}>{role}</option>)}
          </select></td>
          <td><time dateTime={account.createdAt}>{formatDate(account.createdAt)}</time></td>
          <td><button type="button" className="btn btn-text lh-admin-delete" disabled={isSelf || changing}
            aria-label={`Delete ${account.email}`} onClick={() => deletion.setSelected(account)}>Delete</button></td>
        </tr>
      })}
    </AdminTable>}
    {data && <AdminPagination page={query.page} pages={data.pages} disabled={changing}
      onChange={page => setQuery(current => ({ ...current, page }))} />}
    <ConfirmModal show={Boolean(deletion.selected)} title={`Delete ${deletion.selected?.name}?`}
      message="This account and its enrollments will be removed. This cannot be undone."
      loading={deletion.deleting} onCancel={() => deletion.setSelected(null)} onConfirm={deletion.confirm} />
  </div>
}

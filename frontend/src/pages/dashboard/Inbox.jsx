import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import FormField from '../../components/common/FormField'
import { useAuth } from '../../context/AuthContext'
import { getContacts, getConversations, getThread, sendMessage } from '../../services/dashboardService'
import { formatDate } from '../../utils/format'
import usePageTitle from '../../utils/usePageTitle'
import useHomeData from '../public/useHomeData'
import useDashboardAction from './useDashboardAction'
import './tools.css'

// Thread requests mark received messages as read. Refresh the sidebar once they load.
function Thread({ contactId, refresh }) {
  const { user } = useAuth()
  const load = useCallback(() => getThread(contactId), [contactId])
  const result = useHomeData(load)
  const [body, setBody] = useState('')
  const action = useDashboardAction()
  const thread = result.data
  useEffect(() => { if (thread) refresh() }, [thread, refresh])

  if (result.loading) return <LoadingState />
  if (result.error) return <ErrorState message={result.error} onRetry={result.retry} />
  return <section>
    <h2>{thread.contact.name}</h2>
    <ul className="lh-message-thread">{thread.messages.map(message => <li key={message._id}
      className={message.sender === user.id ? 'lh-own-message' : undefined}>
      <p>{message.body}</p><small>{formatDate(message.createdAt)}</small>
    </li>)}</ul>
    {!thread.messages.length && <p>Send a message to start the conversation.</p>}
    <form onSubmit={event => {
      event.preventDefault()
      if (body.trim()) action.run(() => sendMessage(contactId, body.trim()), 'Message sent.', () => {
        setBody('')
        result.retry()
      })
    }}>
      <FormField label="Message" as="textarea" value={body} required maxLength={1000}
        onChange={event => setBody(event.target.value)} error={action.fields.body} />
      <button className="btn btn-primary" type="submit" disabled={action.busy || !body.trim()}>
        {action.busy ? 'Sending...' : 'Send message'}
      </button>
    </form>
  </section>
}

export default function Inbox() {
  usePageTitle('Inbox')
  const [selected, setSelected] = useState('')
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion(value => value + 1), [])
  const conversations = useHomeData(getConversations, version)
  const contacts = useHomeData(getContacts)
  return <div className="lh-tool-page">
    <PageHeader title="Inbox" />
    <div className="lh-inbox-grid">
      <aside>
        <h2>Conversations</h2>
        {contacts.loading && <LoadingState count={1} />}
        {contacts.error && <ErrorState message={contacts.error} onRetry={contacts.retry} />}
        {contacts.data && <FormField label="Start a conversation" as="select" value={selected}
          onChange={event => setSelected(event.target.value)}>
          <option value="">Choose a contact</option>
          {contacts.data.contacts.map(contact => <option key={contact._id} value={contact._id}>{contact.name}</option>)}
        </FormField>}
        {conversations.loading && <LoadingState count={1} />}
        {conversations.error && <ErrorState message={conversations.error} onRetry={conversations.retry} />}
        {conversations.data?.conversations.length === 0 && <p>No conversations yet.</p>}
        <ul className="lh-inbox-contacts">{conversations.data?.conversations.map(({ contact, latest, unreadCount }) => (
          <li key={contact._id}><button type="button" className="btn btn-text" aria-pressed={selected === contact._id}
            onClick={() => setSelected(contact._id)}>
            <strong>{contact.name}{unreadCount > 0 ? ' (' + unreadCount + ' unread)' : ''}</strong>
            <small>{latest.body}</small>
          </button></li>
        ))}</ul>
      </aside>
      {selected ? <Thread key={selected} contactId={selected} refresh={refresh} /> : <p>Choose a contact to open a thread.</p>}
    </div>
  </div>
}

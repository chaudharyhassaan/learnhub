import Accordion from 'react-bootstrap/Accordion'
import PageHeader from '../../components/common/PageHeader'
import usePageTitle from '../../utils/usePageTitle'
import './tools.css'

const topics = [
  ['How do I change my password?', 'Open Settings and enter your current password and a new password.'],
  ['Where can I find my messages?', 'Open Inbox from the dashboard sidebar.'],
  ['Why is a lesson file unavailable?', 'Refresh the lesson first. If the file is still missing, ask the instructor to upload it again.'],
]

export default function Help() {
  usePageTitle('Help & Support')
  return <div className="lh-tool-page">
    <PageHeader title="Help & Support" />
    <Accordion>{topics.map(([question, answer], index) => <Accordion.Item key={question} eventKey={String(index)}>
      <Accordion.Header>{question}</Accordion.Header><Accordion.Body>{answer}</Accordion.Body>
    </Accordion.Item>)}</Accordion>
    <p>Contact: <a href="mailto:support@example.com">support@example.com</a></p>
  </div>
}

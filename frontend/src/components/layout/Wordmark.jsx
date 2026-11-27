import { Link } from 'react-router-dom'

export default function Wordmark({ onClick }) {
  return <Link className="lh-wordmark" to="/" onClick={onClick}><span aria-hidden="true">L</span>LearnHub</Link>
}

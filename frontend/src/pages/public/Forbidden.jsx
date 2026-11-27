import usePageTitle from '../../utils/usePageTitle'
import { Link } from 'react-router-dom'

export default function Forbidden() {
  usePageTitle('Access denied')
  return (
    <>
      <h1 className="page-title">You do not have access to this page</h1>
      <Link className="btn btn-primary" to="/dashboard">Go to my dashboard</Link>
    </>
  )
}

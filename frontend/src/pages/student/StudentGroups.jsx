import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import { getMyGroups } from '../../services/dashboardService'
import usePageTitle from '../../utils/usePageTitle'
import GroupCards from '../dashboard/GroupCards'
import useHomeData from '../public/useHomeData'
import '../dashboard/overview.css'
import '../dashboard/tools.css'

// Group membership is read from the student-only API.
export default function StudentGroups() {
  usePageTitle('My Groups')
  const result = useHomeData(getMyGroups)
  return <div className="lh-tool-page">
    <PageHeader title="My Groups" />
    {result.loading && <LoadingState variant="cards" />}
    {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
    {result.data && <GroupCards groups={result.data.groups} />}
  </div>
}

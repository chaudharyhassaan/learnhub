import PageHeader from '../components/common/PageHeader'
import usePageTitle from '../utils/usePageTitle'

// The shell can be reviewed while the linked dashboard pages are being built.
export default function DashboardPending({ title }) {
  usePageTitle(title)
  return <PageHeader title={title} description="This page is being prepared." />
}

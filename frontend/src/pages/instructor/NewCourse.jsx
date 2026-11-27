import PageHeader from '../../components/common/PageHeader'
import CourseForm from './CourseForm'
import '../../styles/instructor.css'

export default function NewCourse() {
  return <div className="lh-instructor-page"><PageHeader title="Create course" /><CourseForm /></div>
}

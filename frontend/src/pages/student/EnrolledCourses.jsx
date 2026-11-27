import { Link } from 'react-router-dom'
import CourseThumb from '../../components/common/CourseThumb'
import ProgressBar from '../../components/common/ProgressBar'

// Both student grids show the progress returned for the current enrollment.
export default function EnrolledCourses({ courses }) {
  return (
    <div className="row g-3">
      {courses.map(({ course, progress }) => (
        <div className="col-12 col-md-6 col-xl-4 d-flex flex-column" key={course._id}>
          <article className="card lh-enrolled-card">
            <CourseThumb title={course.title} thumbnail={course.thumbnail} />
            <div className="card-body">
              <h3>{course.title}</h3>
              <ProgressBar value={progress} />
              <Link className="btn btn-outline-primary" to={`/learn/${course._id}`}
                aria-label={`Continue learning ${course.title}`}>Continue</Link>
            </div>
          </article>
        </div>
      ))}
    </div>
  )
}

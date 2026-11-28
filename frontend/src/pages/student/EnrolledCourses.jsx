import { Link } from 'react-router-dom'
import CourseThumb from '../../components/common/CourseThumb'
import CourseRating from '../../components/common/CourseRating'
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
              <p>{course.level || 'Basic'}</p>
              <CourseRating average={course.ratingAverage} count={course.ratingCount} />
              <ProgressBar value={progress} />
              <div className="lh-enrolled-actions">
                <Link className="btn btn-outline-primary" to={`/learn/${course._id}`}
                  aria-label={`Continue learning ${course.title}`}>Continue</Link>
                <Link className="btn btn-primary" to={`/courses/${course._id}`}
                  aria-label={`View details for ${course.title}`}>View Details</Link>
              </div>
            </div>
          </article>
        </div>
      ))}
    </div>
  )
}

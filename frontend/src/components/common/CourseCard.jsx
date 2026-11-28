import { Link } from 'react-router-dom'
import { formatPrice } from '../../utils/format'
import CourseThumb from './CourseThumb'
import CourseRating from './CourseRating'

// The dashboard uses the same card data as the catalogue, with completion added.
export default function CourseCard({ course, dashboard = false }) {
  return <article className={dashboard ? 'card lh-course-card lh-summary-course' : 'card lh-course-card'}>
    <CourseThumb title={course.title} thumbnail={course.thumbnail} />
    <div className="lh-course-info">
      <h3 title={dashboard ? course.title : undefined}>{course.title}</h3>
      {dashboard ? <div className="lh-course-meta">
        <span>{course.lessonCount} lessons</span><span>{course.durationHours} hrs</span><span className="lh-level">{course.level}</span>
      </div> : <>
        <span>{course.instructor?.name}</span><span>{course.category} · {course.level || 'Basic'}</span>
      </>}
      <div className="lh-course-meta">
        <strong>{formatPrice(course.price)}</strong>
        {course.originalPrice > course.price && <del>{formatPrice(course.originalPrice)}</del>}
      </div>
      <div className="lh-course-meta">
        <CourseRating average={course.ratingAverage} count={course.ratingCount} />
        {dashboard && <span>{course.studentCount} {course.studentCount === 1 ? 'student' : 'students'}</span>}
      </div>
      {dashboard && <div className="lh-course-meta">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="var(--lh-sand)" strokeWidth="3" />
          <circle cx="12" cy="12" r="9" fill="none" stroke="var(--lh-walnut)" strokeWidth="3" pathLength="100"
            strokeDasharray={course.completionRate + ' 100'} transform="rotate(-90 12 12)" />
        </svg>
        Completion Rate {course.completionRate}%
      </div>}
      <Link className="btn btn-primary" to={`/courses/${course._id}`}
        aria-label={`View details for ${course.title}`}>View Details</Link>
    </div>
  </article>
}

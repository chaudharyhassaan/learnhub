import { Link } from 'react-router-dom'
import { formatPrice } from '../../utils/format'
import CourseThumb from './CourseThumb'

// Use the populated instructor returned by the course listing endpoint.
export default function CourseCard({ course }) {
  return <article className="card lh-course-card">
    <CourseThumb title={course.title} thumbnail={course.thumbnail} />
    <div className="lh-course-info">
      <h3>{course.title}</h3>
      <span>{course.instructor?.name}</span><span>{course.category}</span>
      <strong>{formatPrice(course.price)}</strong>
      <Link className="btn btn-outline-primary" to={`/courses/${course._id}`}
        aria-label={`View details for ${course.title}`}>View details</Link>
    </div>
  </article>
}

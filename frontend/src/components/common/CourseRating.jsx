import { StarFill } from 'react-bootstrap-icons'

export default function CourseRating({ average = 0, count = 0 }) {
  return <span className="lh-course-rating">
    <StarFill aria-hidden="true" />
    {count ? <span>{average.toFixed(1)} <span className="visually-hidden">out of 5 based on</span> ({count})</span> : 'No ratings yet'}
    {count > 0 && <span className="visually-hidden">reviews</span>}
  </span>
}

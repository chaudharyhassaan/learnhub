import { useCallback } from 'react'
import CourseRating from '../../components/common/CourseRating'
import ErrorState from '../../components/common/ErrorState'
import FormField from '../../components/common/FormField'
import LoadingState from '../../components/common/LoadingState'
import { getReviews, saveReview } from '../../services/dashboardService'
import { formatDate } from '../../utils/format'
import useDashboardAction from '../dashboard/useDashboardAction'
import useHomeData from './useHomeData'

// The API upserts one review per enrolled student.
export default function CourseReviews({ course, canReview, refreshCourse }) {
  const load = useCallback(() => getReviews(course._id), [course._id])
  const result = useHomeData(load)
  const action = useDashboardAction()
  return <section className="col-lg-8 lh-course-reviews">
    <h2>Reviews</h2>
    <CourseRating average={course.ratingAverage} count={course.ratingCount} />
    {result.loading && <LoadingState count={2} />}
    {result.error && <ErrorState message={result.error} onRetry={result.retry} />}
    {result.data?.reviews.length === 0 && <p>No reviews yet.</p>}
    <ul className="lh-dashboard-list">{result.data?.reviews.map(review => <li key={review._id}>
      <div><strong>{review.firstName}</strong> · <span>{review.rating} / 5</span>
        {review.comment && <p>{review.comment}</p>}{review.updatedAt && <small>{formatDate(review.updatedAt)}</small>}
      </div>
    </li>)}</ul>
    {canReview && <form className="lh-tool-form" onSubmit={event => {
      event.preventDefault()
      const { rating, comment } = Object.fromEntries(new FormData(event.currentTarget))
      action.run(() => saveReview(course._id, { rating: Number(rating), comment }), 'Review saved.', refreshCourse)
    }}>
      <h3>Write or update your review</h3>
      <FormField label="Rating" name="rating" as="select" defaultValue="5" error={action.fields.rating}>
        {[5, 4, 3, 2, 1].map(rating => <option key={rating} value={rating}>{rating} out of 5</option>)}
      </FormField>
      <FormField label="Comment (optional)" name="comment" as="textarea" maxLength={500} error={action.fields.comment} />
      <button type="submit" className="btn btn-primary" disabled={action.busy}>Save review</button>
    </form>}
  </section>
}

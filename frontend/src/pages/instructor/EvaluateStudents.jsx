import { useCallback, useState } from 'react'
import FormField from '../../components/common/FormField'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/common/ErrorState'
import LoadingState from '../../components/common/LoadingState'
import { getMyCourses } from '../../services/courseService'
import { getInstructorStudents, saveEvaluation } from '../../services/dashboardService'
import usePageTitle from '../../utils/usePageTitle'
import useHomeData from '../public/useHomeData'
import useDashboardAction from '../dashboard/useDashboardAction'
import '../dashboard/tools.css'

function EvaluationForm({ student, courseId }) {
  const action = useDashboardAction()
  return <form onSubmit={event => {
    event.preventDefault()
    const { score, feedback } = Object.fromEntries(new FormData(event.currentTarget))
    action.run(() => saveEvaluation({ courseId, studentId: student.studentId, score: Number(score), feedback }), 'Evaluation saved.')
  }}>
    <FormField label={'Score for ' + student.name} name="score" type="number" min={0} max={100} step="any" required
      defaultValue={student.evaluation?.score} error={action.fields.score} />
    <FormField label={'Feedback for ' + student.name} name="feedback" as="textarea" maxLength={500}
      defaultValue={student.evaluation?.feedback} error={action.fields.feedback} />
    <button className="btn btn-outline-primary" type="submit" disabled={action.busy}>Save evaluation</button>
  </form>
}

function StudentTable({ courseId }) {
  const load = useCallback(() => getInstructorStudents(courseId), [courseId])
  const result = useHomeData(load)
  if (result.loading) return <LoadingState variant="table" />
  if (result.error) return <ErrorState message={result.error} onRetry={result.retry} />
  if (!result.data.students.length) return <p>No students are enrolled in this course.</p>
  return <div className="lh-tool-table" tabIndex={0} role="region" aria-label="Course evaluations">
    <table className="table"><thead><tr><th scope="col">Student</th><th scope="col">Progress</th><th scope="col">Evaluation</th></tr></thead>
      <tbody>{result.data.students.map(student => <tr key={student.studentId}>
        <th scope="row">{student.name}</th><td>{student.progress}%</td>
        <td><EvaluationForm student={student} courseId={courseId} /></td>
      </tr>)}</tbody>
    </table>
  </div>
}

// Pick a course before requesting its enrollment records.
export default function EvaluateStudents() {
  usePageTitle('Evaluate Students')
  const courses = useHomeData(getMyCourses)
  const [courseId, setCourseId] = useState('')
  return <div className="lh-tool-page"><PageHeader title="Evaluate Students" />
    {courses.loading && <LoadingState count={1} />}
    {courses.error && <ErrorState message={courses.error} onRetry={courses.retry} />}
    {courses.data && !courses.data.courses.length && <p>Create a course before evaluating students.</p>}
    {courses.data?.courses.length > 0 && <FormField label="Course" as="select" value={courseId} onChange={event => setCourseId(event.target.value)}>
      <option value="">Choose a course</option>
      {courses.data.courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
    </FormField>}
    {courseId && <StudentTable key={courseId} courseId={courseId} />}
  </div>
}

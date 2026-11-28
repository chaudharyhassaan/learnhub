import { ArrowRight } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom'
import getInitials from '../../utils/getInitials'

// Instructor summaries already include initials. Student summaries carry display names.
export default function GroupCards({ groups, manage = false }) {
  if (!groups.length) return <p>No groups yet.</p>
  return <div className="lh-group-grid">
    {groups.map(group => {
      const initials = group.memberInitials || group.members.slice(0, 3).map(member => getInitials(member.name))
      const count = group.memberCount ?? group.members.length
      return <article className="card lh-group-card" key={group._id}>
        <h3>{group.name}</h3><p>{group.meetingLabel || 'Meeting time to be announced'}</p>
        <div className="lh-section-heading">
          <div className="lh-avatar-stack" aria-label={count + ' members'}>
            {initials.map((value, index) => <span className="lh-avatar" key={index} aria-hidden="true">{value}</span>)}
            {count > initials.length && <span className="lh-avatar" aria-hidden="true">+{count - initials.length}</span>}
          </div>
          <Link className="btn btn-outline-primary lh-group-arrow"
            to={manage ? '/dashboard/instructor/groups?group=' + group._id : '/courses/' + group.course?._id}
            aria-label={manage ? 'Open ' + group.name : 'View course for ' + group.name}><ArrowRight aria-hidden="true" /></Link>
        </div>
      </article>
    })}
  </div>
}

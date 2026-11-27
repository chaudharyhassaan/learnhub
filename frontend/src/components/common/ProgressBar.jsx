import BootstrapProgress from 'react-bootstrap/ProgressBar'

export default function ProgressBar({ value = 0, label = 'Course progress' }) {
  const percent = Math.round(Math.max(0, Math.min(100, Number(value) || 0)))
  return <div className="lh-progress"><span aria-hidden="true">{percent}%</span>
    <BootstrapProgress now={percent} aria-label={label} />
  </div>
}

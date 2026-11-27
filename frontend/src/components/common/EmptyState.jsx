export default function EmptyState({ title, message, actionLabel, onAction }) {
  return <section><h2>{title}</h2><p>{message}</p>
    <button type="button" className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
  </section>
}

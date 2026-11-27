export default function ErrorState({ message, onRetry }) {
  return <div><p role="alert">{message}</p>
    <button type="button" className="btn btn-outline-primary" onClick={onRetry}>Try again</button>
  </div>
}

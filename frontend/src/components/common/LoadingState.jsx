import Placeholder from 'react-bootstrap/Placeholder'

// Match the space occupied by the incoming content to avoid layout jumps.
export default function LoadingState({ variant = 'text', count = 3 }) {
  return <div role="status">
    <span className="visually-hidden">Loading content</span>
    <div aria-hidden="true" className={'lh-skeletons lh-skeletons-' + variant}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="lh-skeleton">
          {variant === 'cards' && <Placeholder className="lh-skeleton-image" />}
          <Placeholder xs={variant === 'table' ? 3 : 8} />
          {variant !== 'text' && <Placeholder xs={4} />}
          {variant === 'table' && <Placeholder xs={2} />}
        </div>
      ))}
    </div>
  </div>
}

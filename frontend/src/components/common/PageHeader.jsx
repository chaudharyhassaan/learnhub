export default function PageHeader({ title, description, action }) {
  return <header className="lh-page-header">
    <div><h1 className="page-title">{title}</h1>{description && <p>{description}</p>}</div>
    {action}
  </header>
}

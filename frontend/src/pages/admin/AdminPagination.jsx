export default function AdminPagination({ page, pages, onChange, disabled }) {
  if (pages <= 1) return null
  return <nav className="lh-admin-pagination" aria-label="Page navigation">
    <button type="button" className="btn btn-outline-primary" disabled={disabled || page <= 1}
      onClick={() => onChange(page - 1)}>Previous</button>
    <span>Page {page} of {pages}</span>
    <button type="button" className="btn btn-outline-primary" disabled={disabled || page >= pages}
      onClick={() => onChange(page + 1)}>Next</button>
  </nav>
}

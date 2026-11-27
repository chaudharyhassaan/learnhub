// Keep wide tables scrollable inside the dashboard on small screens.
export default function AdminTable({ label, columns, children }) {
  return <div className="table-responsive lh-admin-table" role="region" aria-label={label} tabIndex={0}>
    <table className="table align-middle mb-0">
      <caption className="visually-hidden">{label}</caption>
      <thead><tr>{columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
}

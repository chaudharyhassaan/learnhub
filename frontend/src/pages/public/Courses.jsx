import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CourseCard from '../../components/common/CourseCard'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import FormField from '../../components/common/FormField'
import LoadingState from '../../components/common/LoadingState'
import PageHeader from '../../components/common/PageHeader'
import { getCategories, getCourses } from '../../services/courseService'
import useHomeData from './useHomeData'
import '../../styles/courses.css'

const sortOptions = [
  ['newest', 'Newest'],
  ['price_asc', 'Price low to high'],
  ['price_desc', 'Price high to low'],
]

// The URL stores committed filters so navigation can restore them.
export default function Courses() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'newest'
  const page = Number(params.get('page')) || 1
  const [draft, setDraft] = useState({ params, search })
  if (draft.params !== params) setDraft({ params, search })

  useEffect(() => {
    if (draft.search === search) return
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params)
      const value = draft.search.trim()
      if (value) next.set('search', value)
      else next.delete('search')
      next.delete('page')
      if (next.toString() !== params.toString()) setParams(next)
      else setDraft({ params, search })
    }, 400)
    return () => clearTimeout(timer)
  }, [draft.search, params, search, setParams])

  const loadCourses = useCallback(() => getCourses({
    search: search || undefined, category: category || undefined, sort, page,
  }), [search, category, sort, page])
  const results = useHomeData(loadCourses)
  const categories = useHomeData(getCategories)

  function changeFilter(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') {
      next.delete('page')
      const pendingSearch = draft.search.trim()
      if (pendingSearch) next.set('search', pendingSearch)
      else next.delete('search')
    }
    setParams(next)
  }

  function clearFilters() {
    setDraft({ params, search: '' })
    setParams({})
  }

  return (
    <div className="lh-catalogue">
      <PageHeader title="Courses" description="Find something to learn." />
      <div className="row g-3 lh-course-filters">
        <div className="col-12 col-md-4">
          <FormField label="Search" type="search" value={draft.search} maxLength={100}
            onChange={event => setDraft({ params, search: event.target.value })} />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <FormField label="Category" as="select" value={category}
            onChange={event => changeFilter('category', event.target.value)}>
            <option value="">All</option>
            {category && !categories.data?.includes(category) && <option value={category}>{category}</option>}
            {categories.data?.map(name => <option key={name}>{name}</option>)}
          </FormField>
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <FormField label="Sort" as="select" value={sort}
            onChange={event => changeFilter('sort', event.target.value)}>
            {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FormField>
        </div>
      </div>
      {categories.error && <ErrorState message={categories.error} onRetry={categories.retry} />}
      {results.loading && <LoadingState variant="cards" count={4} />}
      {results.error && <ErrorState message={results.error} onRetry={results.retry} />}
      {results.data && (
        <>
          {results.data.courses.length ? (
            <div className="row g-3">
              {results.data.courses.map(course => (
                <div key={course._id} className="col-12 col-md-6 col-lg-4 col-xl-3 d-flex flex-column">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No courses match your search" message="Clear your filters to see all courses."
              actionLabel="Clear filters" onAction={clearFilters} />
          )}
          {results.data.pages > 1 && (
            <nav className="lh-pagination" aria-label="Course pages">
              <button className="btn btn-outline-primary" type="button" disabled={page <= 1}
                onClick={() => changeFilter('page', page - 1)}>Previous</button>
              <span>Page {page} of {results.data.pages}</span>
              <button className="btn btn-outline-primary" type="button" disabled={page >= results.data.pages}
                onClick={() => changeFilter('page', page + 1)}>Next</button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}

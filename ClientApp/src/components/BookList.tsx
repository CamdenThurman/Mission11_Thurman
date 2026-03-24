import { useCallback, useEffect, useState } from 'react'

export interface Book {
  bookID: number
  title: string
  author: string
  publisher: string
  isbn: string
  classification: string
  category: string
  pageCount: number
  price: number
}

interface PagedBooksResponse {
  items: Book[]
  totalCount: number
  page: number
  pageSize: number
}

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const

export function BookList() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sortTitle, setSortTitle] = useState<'asc' | 'desc'>('asc')
  const [data, setData] = useState<PagedBooksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortTitle,
    })
    try {
      const res = await fetch(`/api/books?${params}`)
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`)
      }
      const json: PagedBooksResponse = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load books')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortTitle])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages =
    data && data.pageSize > 0 ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1

  useEffect(() => {
    if (data && page > totalPages) {
      setPage(totalPages)
    }
  }, [data, page, totalPages])

  const handlePageSizeChange = (next: number) => {
    setPageSize(next)
    setPage(1)
  }

  const formatPrice = (value: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)

  return (
    <div className="book-list card shadow-sm">
      <div className="card-body">
        <div className="row g-3 align-items-end mb-3">
          <div className="col-sm-6 col-md-4">
            <label htmlFor="pageSize" className="form-label mb-1">
              Results per page
            </label>
            <select
              id="pageSize"
              className="form-select"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-6 col-md-4">
            <span className="form-label d-block mb-1">Sort by title</span>
            <div className="btn-group" role="group" aria-label="Title sort order">
              <button
                type="button"
                className={`btn btn-outline-primary${sortTitle === 'asc' ? ' active' : ''}`}
                onClick={() => setSortTitle('asc')}
              >
                A → Z
              </button>
              <button
                type="button"
                className={`btn btn-outline-primary${sortTitle === 'desc' ? ' active' : ''}`}
                onClick={() => setSortTitle('desc')}
              >
                Z → A
              </button>
            </div>
          </div>
          <div className="col-md-4 text-md-end">
            {data != null && (
              <p className="text-muted small mb-0">
                Showing {(data.page - 1) * data.pageSize + 1}–
                {Math.min(data.page * data.pageSize, data.totalCount)} of {data.totalCount} books
              </p>
            )}
          </div>
        </div>

        {loading && <p className="text-muted mb-0">Loading books…</p>}
        {error && <div className="alert alert-danger mb-0">{error}</div>}

        {!loading && !error && data && (
          <>
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Author</th>
                    <th scope="col">Publisher</th>
                    <th scope="col">ISBN</th>
                    <th scope="col">Classification</th>
                    <th scope="col">Category</th>
                    <th scope="col" className="text-end">
                      Pages
                    </th>
                    <th scope="col" className="text-end">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
                        No books found.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((b) => (
                      <tr key={b.bookID}>
                        <td>{b.title}</td>
                        <td>{b.author}</td>
                        <td>{b.publisher}</td>
                        <td>
                          <code className="small">{b.isbn}</code>
                        </td>
                        <td>{b.classification}</td>
                        <td>{b.category}</td>
                        <td className="text-end">{b.pageCount}</td>
                        <td className="text-end">{formatPrice(b.price)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <nav
              className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"
              aria-label="Book pagination"
            >
              <div className="text-muted small">
                Page {data.page} of {totalPages}
              </div>
              <ul className="pagination mb-0">
                <li className={`page-item${data.page <= 1 ? ' disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.page <= 1}
                  >
                    Previous
                  </button>
                </li>
                <li className={`page-item${data.page >= totalPages ? ' disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={data.page >= totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </>
        )}
      </div>
    </div>
  )
}

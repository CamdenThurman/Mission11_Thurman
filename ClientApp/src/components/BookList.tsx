import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookFormModal } from './BookFormModal'
import type { Book } from '../types/book'

export type { Book }

interface BookListProps {
  adminMode?: boolean
}

interface PagedBooksResponse {
  items: Book[]
  totalCount: number
  page: number
  pageSize: number
}

interface CartItem {
  book: Book
  quantity: number
}

interface BrowseState {
  page: number
  pageSize: number
  sortTitle: 'asc' | 'desc'
  category: string
}

const CART_KEY = 'bookstore-cart'
const BROWSE_KEY = 'bookstore-browse-state'
const LAST_ADDED_KEY = 'bookstore-last-added-state'
const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const

export function BookList({ adminMode = false }: BookListProps) {
  const [page, setPage] = useState(() => {
    const raw = sessionStorage.getItem(BROWSE_KEY)
    if (!raw) return 1
    try {
      return (JSON.parse(raw) as BrowseState).page ?? 1
    } catch {
      return 1
    }
  })
  const [pageSize, setPageSize] = useState(() => {
    const raw = sessionStorage.getItem(BROWSE_KEY)
    if (!raw) return 5
    try {
      return (JSON.parse(raw) as BrowseState).pageSize ?? 5
    } catch {
      return 5
    }
  })
  const [sortTitle, setSortTitle] = useState<'asc' | 'desc'>(() => {
    const raw = sessionStorage.getItem(BROWSE_KEY)
    if (!raw) return 'asc'
    try {
      return (JSON.parse(raw) as BrowseState).sortTitle ?? 'asc'
    } catch {
      return 'asc'
    }
  })
  const [category, setCategory] = useState(() => {
    const raw = sessionStorage.getItem(BROWSE_KEY)
    if (!raw) return ''
    try {
      return (JSON.parse(raw) as BrowseState).category ?? ''
    } catch {
      return ''
    }
  })
  const [data, setData] = useState<PagedBooksResponse | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const raw = sessionStorage.getItem(CART_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as CartItem[]
    } catch {
      return []
    }
  })
  const [toastMessage, setToastMessage] = useState('')
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
    if (category) {
      params.append('category', category)
    }
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
  }, [page, pageSize, sortTitle, category])

  useEffect(() => {
    void load()
  }, [load])

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const res = await fetch('/api/books/categories')
      if (!res.ok) return
      const json: string[] = await res.json()
      setCategories(json)
    } catch {
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  useEffect(() => {
    const state: BrowseState = { page, pageSize, sortTitle, category }
    sessionStorage.setItem(BROWSE_KEY, JSON.stringify(state))
  }, [page, pageSize, sortTitle, category])

  useEffect(() => {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

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

  const handleCategoryChange = (next: string) => {
    setCategory(next)
    setPage(1)
  }

  const openAddBook = () => {
    setEditingBook(null)
    setBookModalOpen(true)
  }

  const openEditBook = (b: Book) => {
    setEditingBook(b)
    setBookModalOpen(true)
  }

  const closeBookModal = () => {
    setBookModalOpen(false)
    setEditingBook(null)
  }

  const handleBookSaved = () => {
    void load()
    void loadCategories()
    setToastMessage(editingBook ? 'Book updated' : 'Book added')
  }

  const deleteBook = async (b: Book) => {
    if (!window.confirm(`Delete "${b.title}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/books/${b.bookID}`, { method: 'DELETE' })
      if (!res.ok) {
        setToastMessage(`Delete failed (${res.status})`)
        return
      }
      setCart((prev) => prev.filter((x) => x.book.bookID !== b.bookID))
      setToastMessage(`Deleted "${b.title}"`)
      await load()
      await loadCategories()
    } catch {
      setToastMessage('Delete failed')
    }
  }

  const addToCart = (book: Book) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.book.bookID === book.bookID)
      if (existing) {
        return prev.map((x) =>
          x.book.bookID === book.bookID ? { ...x, quantity: x.quantity + 1 } : x,
        )
      }
      return [...prev, { book, quantity: 1 }]
    })

    const currentBrowse: BrowseState = { page, pageSize, sortTitle, category }
    sessionStorage.setItem(LAST_ADDED_KEY, JSON.stringify(currentBrowse))
    setToastMessage(`Added "${book.title}" to cart`)
  }

  const updateQuantity = (bookID: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((x) => x.book.bookID !== bookID))
      return
    }
    setCart((prev) => prev.map((x) => (x.book.bookID === bookID ? { ...x, quantity } : x)))
  }

  const continueShopping = () => {
    const raw = sessionStorage.getItem(LAST_ADDED_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as BrowseState
      setPage(saved.page ?? 1)
      setPageSize(saved.pageSize ?? 5)
      setSortTitle(saved.sortTitle ?? 'asc')
      setCategory(saved.category ?? '')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // No-op if saved state is invalid.
    }
  }

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0),
    [cart],
  )
  const shipping = cart.length > 0 ? 5.99 : 0
  const total = subtotal + shipping
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const formatPrice = (value: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)

  return (
    <div className="book-list">
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm">
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

                <div className="col-sm-6 col-md-8 text-md-end">
                  <span className="form-label d-block mb-1 text-md-end">Sort by title</span>
                  <div
                    className="btn-group"
                    role="group"
                    aria-label="Title sort order"
                  >
                    <button
                      type="button"
                      className={`btn btn-outline-primary${sortTitle === 'asc' ? ' active' : ''}`}
                      onClick={() => setSortTitle('asc')}
                    >
                      A to Z
                    </button>
                    <button
                      type="button"
                      className={`btn btn-outline-primary${sortTitle === 'desc' ? ' active' : ''}`}
                      onClick={() => setSortTitle('desc')}
                    >
                      Z to A
                    </button>
                  </div>
                </div>

                <div className="col-12">
                  <label htmlFor="category-select" className="form-label d-block mb-2">
                    Category
                  </label>
                  {categoriesLoading ? (
                    <p className="text-muted small mb-0">Loading categories…</p>
                  ) : (
                    <select
                      id="category-select"
                      className="form-select form-select-sm"
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      aria-label="Category filter"
                    >
                      <option value="">All categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                {data != null && (
                  <p className="text-muted small mb-0">
                    Showing {(data.page - 1) * data.pageSize + 1}-
                    {Math.min(data.page * data.pageSize, data.totalCount)} of {data.totalCount} books
                    {category ? ` in ${category}` : ''}
                  </p>
                )}
                {adminMode && (
                  <button type="button" className="btn btn-success btn-sm" onClick={openAddBook}>
                    Add book
                  </button>
                )}
              </div>

              {loading && <p className="text-muted mb-0">Loading books...</p>}
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
                          <th scope="col">Category</th>
                          <th scope="col" className="text-end">
                            Price
                          </th>
                          <th scope="col" className="text-end">
                            Cart
                          </th>
                          {adminMode && (
                            <th scope="col" className="text-end">
                              Manage
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.length === 0 ? (
                          <tr>
                            <td colSpan={adminMode ? 8 : 7} className="text-center text-muted py-4">
                              No books found.
                            </td>
                          </tr>
                        ) : (
                          data.items.map((b) => (
                            <tr key={b.bookID}>
                              <td>
                                <div className="fw-semibold">{b.title}</div>
                                <div className="text-muted small">{b.classification}</div>
                              </td>
                              <td>{b.author}</td>
                              <td>{b.publisher}</td>
                              <td>
                                <code className="small">{b.isbn}</code>
                              </td>
                              <td>{b.category}</td>
                              <td className="text-end">{formatPrice(b.price)}</td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => addToCart(b)}
                                >
                                  Add
                                </button>
                              </td>
                              {adminMode && (
                                <td className="text-end text-nowrap">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary me-1"
                                    onClick={() => openEditBook(b)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => void deleteBook(b)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
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
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm sticky-top cart-sticky">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Cart Summary</span>
              <span className="badge text-bg-primary rounded-pill">{cartCount}</span>
            </div>
            <div className="card-body">
              {cart.length === 0 ? (
                <p className="text-muted mb-0">Your cart is empty.</p>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Book</th>
                          <th className="text-end">Qty</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item) => (
                          <tr key={item.book.bookID}>
                            <td>
                              <div className="small fw-semibold">{item.book.title}</div>
                              <div className="text-muted x-small">{formatPrice(item.book.price)} each</div>
                            </td>
                            <td className="text-end" style={{ width: '90px' }}>
                              <input
                                type="number"
                                className="form-control form-control-sm text-end"
                                min={0}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.book.bookID, Number(e.target.value))}
                              />
                            </td>
                            <td className="text-end">
                              {formatPrice(item.book.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Shipping</span>
                      <span>{formatPrice(shipping)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </>
              )}
              <button
                type="button"
                className="btn btn-outline-secondary w-100 mt-3"
                onClick={continueShopping}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>

      {adminMode && (
        <BookFormModal
          show={bookModalOpen}
          book={editingBook}
          onHide={closeBookModal}
          onSaved={handleBookSaved}
        />
      )}

      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div
          className={`toast align-items-center text-bg-success border-0${toastMessage ? ' show' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body">{toastMessage}</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              aria-label="Close"
              onClick={() => setToastMessage('')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Book } from '../types/book'

const emptyForm = {
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  classification: '',
  category: '',
  pageCount: 300,
  price: 14.99,
}

export interface BookFormModalProps {
  show: boolean
  book: Book | null
  onHide: () => void
  onSaved: () => void
}

export function BookFormModal({ show, book, onHide, onSaved }: BookFormModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!show) return
    setFormError(null)
    if (book) {
      setForm({
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        isbn: book.isbn,
        classification: book.classification,
        category: book.category,
        pageCount: book.pageCount,
        price: book.price,
      })
    } else {
      setForm(emptyForm)
    }
  }, [show, book])

  useEffect(() => {
    if (!show) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [show])

  useEffect(() => {
    if (!show) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onHide()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [show, saving, onHide])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    const body = {
      title: form.title.trim(),
      author: form.author.trim(),
      publisher: form.publisher.trim(),
      isbn: form.isbn.trim(),
      classification: form.classification.trim(),
      category: form.category.trim(),
      pageCount: form.pageCount,
      price: form.price,
    }
    try {
      if (book) {
        const res = await fetch(`/api/books/${book.bookID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          const msg =
            err?.errors && typeof err.errors === 'object'
              ? Object.values(err.errors as Record<string, string[]>).flat().join(' ')
              : `Update failed (${res.status})`
          throw new Error(msg || 'Update failed')
        }
      } else {
        const res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          const msg =
            err?.errors && typeof err.errors === 'object'
              ? Object.values(err.errors as Record<string, string[]>).flat().join(' ')
              : `Create failed (${res.status})`
          throw new Error(msg || 'Create failed')
        }
      }
      onSaved()
      onHide()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  return createPortal(
    <>
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050 }}
        aria-hidden="true"
        onMouseDown={(e) => {
          e.preventDefault()
          if (!saving) onHide()
        }}
      />
      <div
        className="modal fade show d-block"
        style={{ zIndex: 1055 }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="modal-header">
                <h2 className="modal-title fs-5" id="book-modal-title">
                  {book ? 'Edit book' : 'Add book'}
                </h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onHide}
                  disabled={saving}
                />
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" htmlFor="bf-title">
                      Title
                    </label>
                    <input
                      id="bf-title"
                      className="form-control"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="bf-author">
                      Author
                    </label>
                    <input
                      id="bf-author"
                      className="form-control"
                      value={form.author}
                      onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="bf-publisher">
                      Publisher
                    </label>
                    <input
                      id="bf-publisher"
                      className="form-control"
                      value={form.publisher}
                      onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="bf-isbn">
                      ISBN
                    </label>
                    <input
                      id="bf-isbn"
                      className="form-control"
                      value={form.isbn}
                      onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="bf-classification">
                      Classification
                    </label>
                    <input
                      id="bf-classification"
                      className="form-control"
                      value={form.classification}
                      onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="bf-category">
                      Category
                    </label>
                    <input
                      id="bf-category"
                      className="form-control"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="bf-pages">
                      Pages
                    </label>
                    <input
                      id="bf-pages"
                      type="number"
                      className="form-control"
                      min={0}
                      value={form.pageCount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pageCount: Number(e.target.value) }))
                      }
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="bf-price">
                      Price
                    </label>
                    <input
                      id="bf-price"
                      type="number"
                      className="form-control"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onHide}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

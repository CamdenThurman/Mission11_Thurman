import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { BookList } from './components/BookList'
import './App.css'

function App() {
  return (
    <div className="app-shell py-4 py-md-5">
      <header className="text-center mb-4">
        <h1 className="display-5 fw-semibold">Mission 12 Bookstore</h1>
        <p className="lead text-muted mb-0">
          Browse, filter, and sort books, then manage your cart with session persistence.
        </p>
        <nav className="d-flex justify-content-center gap-2 mt-3">
          <Link to="/" className="btn btn-outline-primary btn-sm">
            Store
          </Link>
          <Link to="/adminbooks" className="btn btn-outline-dark btn-sm">
            Admin Books
          </Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<BookList />} />
        <Route path="/adminbooks" element={<BookList adminMode />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App

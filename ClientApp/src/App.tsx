import { BookList } from './components/BookList'
import './App.css'

function App() {
  return (
    <div className="app-shell py-4 py-md-5">
      <header className="text-center mb-4">
        <h1 className="display-5 fw-semibold">Mission 11 Bookstore</h1>
        <p className="lead text-muted mb-0">
          Browse titles from the course database — paginated, sortable, and styled with Bootstrap.
        </p>
      </header>
      <BookList />
    </div>
  )
}

export default App

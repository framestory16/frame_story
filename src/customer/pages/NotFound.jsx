import { Link } from 'react-router-dom'
import { EmptyState } from '../components.jsx'

export default function NotFound() {
  return (
    <section className="section page-top">
      <div className="container">
        <EmptyState
          title="Page not found"
          text="This page seems to have slipped out of its frame."
          action={
            <Link to="/" className="btn btn-primary">
              Back to home
            </Link>
          }
        />
      </div>
    </section>
  )
}

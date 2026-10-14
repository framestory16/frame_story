import { Link, useParams } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { useShop, useQuery, PRODUCT_FIELDS } from '../store.jsx'
import { ProductGrid, SkeletonGrid, EmptyState } from '../components.jsx'
import { Spinner } from '@shared/ui.jsx'

export default function Category() {
  const { slug } = useParams()
  const { categories, loading } = useShop()
  const category = categories.find((c) => c.slug === slug)

  const products = useQuery(
    () =>
      category
        ? supabase
            .from('products')
            .select(PRODUCT_FIELDS)
            .eq('is_active', true)
            .eq('category_id', category.id)
            .order('sort_order')
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    [category?.id]
  )

  if (loading) return <Spinner />
  if (!category)
    return (
      <section className="section page-top">
        <div className="container">
          <EmptyState
            title="Collection not found"
            action={
              <Link to="/shop" className="btn btn-primary">
                Browse all
              </Link>
            }
          />
        </div>
      </section>
    )

  return (
    <>
      <section className="cat-hero">
        {category.image_url && <img src={category.image_url} alt="" className="cat-hero-bg" />}
        <img src="/floral.png" alt="" className="cat-hero-floral" aria-hidden="true" />
        <div className="container cat-hero-inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link> <span>/</span> <span className="crumb-current">{category.name}</span>
          </nav>
          <span className="eyebrow">Collection</span>
          <h1>{category.name}</h1>
          {category.description && <p>{category.description}</p>}
          {!products.loading && (
            <span className="cat-count">
              {products.data?.length || 0} design{products.data?.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="chips">
            {categories.map((c) => (
              <Link key={c.id} to={`/c/${c.slug}`} className={`chip ${c.id === category.id ? 'active' : ''}`}>
                {c.name}
              </Link>
            ))}
          </div>
          {products.loading ? (
            <SkeletonGrid count={8} />
          ) : products.data?.length ? (
            <ProductGrid products={products.data} />
          ) : (
            <EmptyState title="New designs coming soon" text="We're adding pieces to this collection." />
          )}
        </div>
      </section>
    </>
  )
}

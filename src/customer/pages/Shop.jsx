import { useMemo, useState } from 'react'
import { supabase } from '@shared/supabase.js'
import { useShop, useQuery, PRODUCT_FIELDS } from '../store.jsx'
import { ProductGrid, SkeletonGrid, EmptyState } from '../components.jsx'

export default function Shop() {
  const { categories } = useShop()
  const [active, setActive] = useState('all')

  const products = useQuery(
    () =>
      supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at', { ascending: false }),
    []
  )

  const visible = useMemo(
    () => (products.data || []).filter((p) => active === 'all' || p.category_id === active),
    [products.data, active]
  )

  return (
    <section className="section page-top">
      <div className="container">
        <div className="page-head">
          <span className="eyebrow">Shop</span>
          <h1>All our creations</h1>
          <p className="muted">Handmade frames, polaroids and gifts — personalised with your photos.</p>
        </div>

        {categories.length > 0 && (
          <div className="chips" role="tablist" aria-label="Filter by collection">
            <button className={`chip ${active === 'all' ? 'active' : ''}`} onClick={() => setActive('all')}>
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`chip ${active === c.id ? 'active' : ''}`}
                onClick={() => setActive(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {products.loading ? (
          <SkeletonGrid count={8} />
        ) : visible.length ? (
          <ProductGrid products={visible} />
        ) : (
          <EmptyState title="Nothing here yet" text="New designs are on the way." />
        )}
      </div>
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { priceLabel, errorMessage } from '@shared/utils.js'
import { Spinner } from '@shared/ui.jsx'
import { IconPlus, IconSearch, IconImage } from '@shared/icons.jsx'
import { useToast } from '../toast.jsx'

export default function Products() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || 'all'
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      supabase
        .from('products')
        .select('id, title, price, sizes, images, is_active, is_featured, category_id, sort_order, categories(name)')
        .order('sort_order')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('sort_order').order('name'),
    ]).then(([p, c]) => {
      if (p.error) toast(errorMessage(p.error), 'error')
      setProducts(p.data || [])
      setCategories(c.data || [])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (products || []).filter(
      (p) =>
        (category === 'all' || (category === 'none' ? !p.category_id : p.category_id === category)) &&
        (!q || p.title.toLowerCase().includes(q))
    )
  }, [products, category, search])

  return (
    <div className="page">
      <div className="page-bar">
        <div>
          <h1>Products</h1>
          <p className="muted">Items inside each category. Hidden items don't appear on the shop.</p>
        </div>
        <Link
          to={category !== 'all' && category !== 'none' ? `/products/new?category=${category}` : '/products/new'}
          className="btn btn-primary btn-sm"
        >
          <IconPlus size={16} /> Add product
        </Link>
      </div>

      <div className="filters">
        <select
          className="input"
          value={category}
          onChange={(e) => setParams(e.target.value === 'all' ? {} : { category: e.target.value })}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="none">Uncategorised</option>
        </select>
        <div className="search">
          <IconSearch size={18} />
          <input className="input" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {products === null ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <div className="empty-box">
          No products here yet.{' '}
          <Link to={category !== 'all' && category !== 'none' ? `/products/new?category=${category}` : '/products/new'}>
            Add one
          </Link>
        </div>
      ) : (
        <div className="prod-admin-grid">
          {visible.map((p) => (
            <Link key={p.id} to={`/products/${p.id}`} className={`prod-admin-card ${p.is_active ? '' : 'is-hidden'}`}>
              <div className="prod-admin-media">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" loading="lazy" />
                ) : (
                  <span className="no-img">
                    <IconImage size={24} />
                  </span>
                )}
                <div className="prod-admin-badges">
                  {!p.is_active && <span className="badge badge-muted">Hidden</span>}
                  {p.is_featured && <span className="badge">Bestseller</span>}
                </div>
              </div>
              <div className="prod-admin-body">
                <strong>{p.title}</strong>
                <span className="muted">{p.categories?.name || 'Uncategorised'}</span>
                <span className="prod-admin-price">{priceLabel(p)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

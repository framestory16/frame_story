import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { errorMessage, deleteSiteImages } from '@shared/utils.js'
import { Spinner, Field, Toggle } from '@shared/ui.jsx'
import { IconArrowLeft, IconPlus, IconTrash, IconX } from '@shared/icons.jsx'
import { ImagesEditor } from '../components.jsx'
import { useToast } from '../toast.jsx'

const EMPTY = {
  title: '',
  description: '',
  category_id: '',
  price: '',
  compare_price: '',
  sizes: [],
  images: [],
  allow_photo_upload: true,
  max_photos: 5,
  is_active: true,
  is_featured: false,
  sort_order: 0,
}

const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export default function ProductEdit() {
  const { id } = useParams()
  const isNew = id === 'new'
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [original, setOriginal] = useState(null)
  const [categories, setCategories] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('sort_order')
      .order('name')
      .then(({ data }) => setCategories(data || []))

    if (isNew) {
      setForm({ ...EMPTY, category_id: params.get('category') || '' })
      return
    }
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast('Product not found', 'error')
          return navigate('/products')
        }
        const f = {
          ...data,
          price: data.price ?? '',
          compare_price: data.compare_price ?? '',
          category_id: data.category_id || '',
          description: data.description || '',
          sizes: (data.sizes || []).map((s) => ({ label: s.label, price: s.price ?? '' })),
        }
        setForm(f)
        setOriginal(data)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!form) return <Spinner />

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const setSize = (i, key, value) =>
    set(
      'sizes',
      form.sizes.map((s, k) => (k === i ? { ...s, [key]: value } : s))
    )

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast('Please enter a product name', 'error')
    const sizes = form.sizes
      .filter((s) => s.label.trim())
      .map((s) => ({ label: s.label.trim(), price: toNum(s.price) }))
    if (new Set(sizes.map((s) => s.label)).size !== sizes.length) return toast('Two sizes have the same name', 'error')

    setBusy(true)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      price: toNum(form.price),
      compare_price: toNum(form.compare_price),
      sizes,
      images: form.images,
      allow_photo_upload: form.allow_photo_upload,
      max_photos: Math.min(20, Math.max(0, Number(form.max_photos) || 0)),
      is_active: form.is_active,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
    }
    const { error } = isNew
      ? await supabase.from('products').insert(payload)
      : await supabase.from('products').update(payload).eq('id', id)
    setBusy(false)
    if (error) return toast(errorMessage(error), 'error')

    if (original) deleteSiteImages(original.images.filter((u) => !payload.images.includes(u)))
    toast(isNew ? 'Product added' : 'Product saved')
    navigate(payload.category_id ? `/products?category=${payload.category_id}` : '/products')
  }

  async function remove() {
    if (!confirm(`Delete "${form.title}"? Past orders keep their details.`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return toast(errorMessage(error), 'error')
    deleteSiteImages(original.images)
    toast('Product deleted')
    navigate('/products')
  }

  return (
    <form className="page" onSubmit={save}>
      <div className="page-bar">
        <div>
          <Link to="/products" className="back-link">
            <IconArrowLeft size={16} /> Products
          </Link>
          <h1>{isNew ? 'Add product' : 'Edit product'}</h1>
        </div>
        <div className="bar-actions">
          {!isNew && (
            <button type="button" className="btn btn-danger btn-sm" onClick={remove}>
              <IconTrash size={16} /> Delete
            </button>
          )}
          <button className="btn btn-primary btn-sm" disabled={busy}>
            {busy ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </div>

      <div className="edit-grid">
        <div className="panel">
          <h3>Details</h3>
          <Field label="Product name" required>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Classic wooden photo frame" />
          </Field>
          <Field label="Category">
            <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">— Uncategorised —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" hint="Material, finish, what's included, delivery time…">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} />
          </Field>

          <h3>Photos</h3>
          <p className="muted small">The first photo is the cover. Use the arrows to reorder.</p>
          <ImagesEditor value={form.images} onChange={(v) => set('images', v)} folder="products" />
        </div>

        <div className="panel">
          <h3>Price</h3>
          {form.sizes.length === 0 && (
            <div className="form-row cols-2">
              <Field label="Price (₹)" hint="Leave empty for “Price on request”">
                <input type="number" min="0" step="1" value={form.price} onChange={(e) => set('price', e.target.value)} />
              </Field>
              <Field label="Original price (₹)" hint="Optional, shown crossed out">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.compare_price}
                  onChange={(e) => set('compare_price', e.target.value)}
                />
              </Field>
            </div>
          )}

          <span className="field-label">Sizes / options</span>
          <p className="muted small">
            {form.sizes.length
              ? 'Customers must pick one. Each size has its own price.'
              : 'Optional — add sizes like A4, 8×10, 12×18 with different prices.'}
          </p>
          {form.sizes.map((s, i) => (
            <div key={i} className="size-row">
              <input className="input" placeholder="Size (e.g. A4)" value={s.label} onChange={(e) => setSize(i, 'label', e.target.value)} />
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Price ₹"
                value={s.price}
                onChange={(e) => setSize(i, 'price', e.target.value)}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => set('sizes', form.sizes.filter((_, k) => k !== i))}
                aria-label="Remove size"
              >
                <IconX size={18} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => set('sizes', [...form.sizes, { label: '', price: '' }])}>
            <IconPlus size={16} /> Add size
          </button>

          <h3>Customer photos</h3>
          <Toggle
            checked={form.allow_photo_upload}
            onChange={(v) => set('allow_photo_upload', v)}
            label="Customer uploads their own photos"
          />
          {form.allow_photo_upload && (
            <Field label="Max photos per order">
              <input
                type="number"
                min="1"
                max="20"
                value={form.max_photos}
                onChange={(e) => set('max_photos', e.target.value)}
              />
            </Field>
          )}

          <h3>Visibility</h3>
          <div className="toggle-stack">
            <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label="Show on shop" />
            <Toggle checked={form.is_featured} onChange={(v) => set('is_featured', v)} label="Bestseller (shown on home page)" />
          </div>
          <Field label="Display order" hint="Smaller numbers show first">
            <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          </Field>
        </div>
      </div>
    </form>
  )
}

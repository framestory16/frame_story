import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { slugify, errorMessage, deleteSiteImages } from '@shared/utils.js'
import { Modal, Spinner, Field, Toggle } from '@shared/ui.jsx'
import { IconPlus, IconTrash, IconImage } from '@shared/icons.jsx'
import { ImagePicker } from '../components.jsx'
import { useToast } from '../toast.jsx'

const EMPTY = { name: '', slug: '', description: '', image_url: null, sort_order: 0, is_active: true }

export default function Categories() {
  const toast = useToast()
  const [list, setList] = useState(null)
  const [counts, setCounts] = useState({})
  const [editing, setEditing] = useState(null) // category object or EMPTY

  async function load() {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order').order('name'),
      supabase.from('products').select('category_id'),
    ])
    if (c.error) toast(errorMessage(c.error), 'error')
    setList(c.data || [])
    const n = {}
    ;(p.data || []).forEach((r) => (n[r.category_id] = (n[r.category_id] || 0) + 1))
    setCounts(n)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleActive(cat, value) {
    const { error } = await supabase.from('categories').update({ is_active: value }).eq('id', cat.id)
    if (error) return toast(errorMessage(error), 'error')
    setList((l) => l.map((c) => (c.id === cat.id ? { ...c, is_active: value } : c)))
    toast(value ? 'Category visible on shop' : 'Category hidden from shop')
  }

  return (
    <div className="page">
      <div className="page-bar">
        <div>
          <h1>Categories</h1>
          <p className="muted">These are the collections customers see on the home page (e.g. Photo Frames, Bouquets).</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setEditing({ ...EMPTY, sort_order: (list?.length || 0) + 1 })}
        >
          <IconPlus size={16} /> Add category
        </button>
      </div>

      {list === null ? (
        <Spinner />
      ) : list.length === 0 ? (
        <div className="empty-box">No categories yet. Add your first one.</div>
      ) : (
        <div className="cat-admin-grid">
          {list.map((c) => (
            <div key={c.id} className={`cat-admin-card ${c.is_active ? '' : 'is-hidden'}`}>
              <button className="cat-admin-media" onClick={() => setEditing(c)}>
                {c.image_url ? (
                  <img src={c.image_url} alt="" />
                ) : (
                  <span className="no-img">
                    <IconImage size={26} />
                    Add cover
                  </span>
                )}
              </button>
              <div className="cat-admin-body">
                <div className="cat-admin-title">
                  <strong>{c.name}</strong>
                  <span className="muted">#{c.sort_order}</span>
                </div>
                <Link to={`/products?category=${c.id}`} className="muted small-link">
                  {counts[c.id] || 0} product{counts[c.id] === 1 ? '' : 's'}
                </Link>
                <div className="cat-admin-actions">
                  <Toggle checked={c.is_active} onChange={(v) => toggleActive(c, v)} label="Visible" />
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(c)}>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CategoryForm
          initial={editing}
          productCount={counts[editing.id] || 0}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function CategoryForm({ initial, productCount, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(!!initial.id)
  const [busy, setBusy] = useState(false)
  const isNew = !initial.id

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast('Please enter a name', 'error')
    setBusy(true)
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description?.trim() || null,
      image_url: form.image_url || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }
    const q = isNew
      ? supabase.from('categories').insert(payload)
      : supabase.from('categories').update(payload).eq('id', initial.id)
    const { error } = await q
    setBusy(false)
    if (error) {
      return toast(error.code === '23505' ? 'Another category already uses this link name.' : errorMessage(error), 'error')
    }
    if (!isNew && initial.image_url && initial.image_url !== payload.image_url) deleteSiteImages([initial.image_url])
    toast(isNew ? 'Category added' : 'Category saved')
    onSaved()
  }

  async function remove() {
    const warn = productCount
      ? `Delete "${initial.name}"? Its ${productCount} product(s) will become uncategorised (not deleted).`
      : `Delete "${initial.name}"?`
    if (!confirm(warn)) return
    const { error } = await supabase.from('categories').delete().eq('id', initial.id)
    if (error) return toast(errorMessage(error), 'error')
    if (initial.image_url) deleteSiteImages([initial.image_url])
    toast('Category deleted')
    onSaved()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Add category' : 'Edit category'}
      footer={
        <>
          {!isNew && (
            <button type="button" className="btn btn-danger btn-sm" onClick={remove} style={{ marginRight: 'auto' }}>
              <IconTrash size={16} /> Delete
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="cat-form" className="btn btn-primary btn-sm" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="cat-form" onSubmit={save} className="cat-form">
        <div className="cat-form-image">
          <span className="field-label">Cover image</span>
          <ImagePicker value={form.image_url} onChange={(v) => set('image_url', v)} folder="categories" label="Upload cover" />
        </div>
        <div>
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={(e) => {
                set('name', e.target.value)
                if (!slugTouched) set('slug', slugify(e.target.value))
              }}
              placeholder="e.g. Photo Frames"
              autoFocus
            />
          </Field>
          <Field label="Link name" hint={`Shop link: /c/${slugify(form.slug || form.name) || '…'}`}>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', e.target.value)
              }}
            />
          </Field>
          <Field label="Short description">
            <textarea
              value={form.description || ''}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="e.g. Classic frames for your favourite moments"
            />
          </Field>
          <Field label="Display order" hint="Smaller numbers show first">
            <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          </Field>
          <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label="Visible on shop" />
        </div>
      </form>
    </Modal>
  )
}

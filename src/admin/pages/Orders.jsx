import { useEffect, useMemo, useState } from 'react'
import { supabase, ORDER_BUCKET } from '@shared/supabase.js'
import { ORDER_STATUSES, statusLabel, formatDate, formatPrice, whatsappLink, errorMessage } from '@shared/utils.js'
import { Modal, Spinner, Field } from '@shared/ui.jsx'
import { IconPhone, IconWhatsapp, IconDownload, IconSearch, IconTrash, IconImage } from '@shared/icons.jsx'
import { useToast } from '../toast.jsx'

export default function Orders({ onChange }) {
  const toast = useToast()
  const [orders, setOrders] = useState(null)
  const [tab, setTab] = useState('new')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)

  async function load() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) toast(errorMessage(error), 'error')
    setOrders(data || [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const c = { all: orders?.length || 0 }
    ORDER_STATUSES.forEach((s) => (c[s.value] = 0))
    orders?.forEach((o) => (c[o.status] = (c[o.status] || 0) + 1))
    return c
  }, [orders])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (orders || []).filter((o) => {
      if (tab !== 'all' && o.status !== tab) return false
      if (!q) return true
      return (
        `fs-${o.order_no}`.includes(q) ||
        String(o.order_no).includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.product_title.toLowerCase().includes(q)
      )
    })
  }, [orders, tab, search])

  function updateLocal(updated) {
    setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)))
    onChange?.()
  }

  function removeLocal(id) {
    setOrders((list) => list.filter((o) => o.id !== id))
    setOpenId(null)
    onChange?.()
  }

  const open = orders?.find((o) => o.id === openId)

  return (
    <div className="page">
      <div className="page-bar">
        <h1>Orders</h1>
        <button className="btn btn-outline btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="tabs">
        {[{ value: 'all', label: 'All' }, ...ORDER_STATUSES].map((s) => (
          <button key={s.value} className={`tab ${tab === s.value ? 'active' : ''}`} onClick={() => setTab(s.value)}>
            {s.label} <span>{counts[s.value] || 0}</span>
          </button>
        ))}
      </div>

      <div className="search">
        <IconSearch size={18} />
        <input
          className="input"
          placeholder="Search by order no, name, phone or product"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {orders === null ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <div className="empty-box">No orders here.</div>
      ) : (
        <div className="order-list">
          {visible.map((o) => (
            <button key={o.id} className="order-row" onClick={() => setOpenId(o.id)}>
              <div className="order-row-main">
                <div className="order-row-top">
                  <strong>FS-{o.order_no}</strong>
                  <span className={`status status-${o.status}`}>{statusLabel(o.status)}</span>
                </div>
                <div className="order-row-product">
                  {o.product_title}
                  {o.size_label && ` · ${o.size_label}`} × {o.quantity}
                </div>
                <div className="order-row-meta">
                  {o.customer_name} · {o.phone}
                </div>
              </div>
              <div className="order-row-side">
                <span className="order-row-total">{o.total ? formatPrice(o.total) : '—'}</span>
                <span className="muted">{formatDate(o.created_at)}</span>
                {o.photo_paths?.length > 0 && (
                  <span className="muted photos-count">
                    <IconImage size={14} /> {o.photo_paths.length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <OrderDetail order={open} onClose={() => setOpenId(null)} onUpdated={updateLocal} onDeleted={removeLocal} />
      )}
    </div>
  )
}

function OrderDetail({ order, onClose, onUpdated, onDeleted }) {
  const toast = useToast()
  const [photos, setPhotos] = useState(null) // [{ path, view, download }]
  const [notes, setNotes] = useState(order.admin_notes || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    setNotes(order.admin_notes || '')
    if (!order.photo_paths?.length) {
      setPhotos([])
      return
    }
    // Private bucket → signed links valid for 1 hour.
    Promise.all([
      supabase.storage.from(ORDER_BUCKET).createSignedUrls(order.photo_paths, 3600),
      supabase.storage.from(ORDER_BUCKET).createSignedUrls(order.photo_paths, 3600, { download: true }),
    ]).then(([view, dl]) => {
      if (!alive) return
      setPhotos(
        order.photo_paths.map((path, i) => ({
          path,
          view: view.data?.[i]?.signedUrl,
          download: dl.data?.[i]?.signedUrl,
        }))
      )
    })
    return () => {
      alive = false
    }
  }, [order.id])

  async function update(fields, message) {
    setSaving(true)
    const { data, error } = await supabase.from('orders').update(fields).eq('id', order.id).select().single()
    setSaving(false)
    if (error) return toast(errorMessage(error), 'error')
    onUpdated(data)
    toast(message)
  }

  async function remove() {
    if (!confirm(`Delete order FS-${order.order_no}? This also deletes the customer's photos.`)) return
    if (order.photo_paths?.length) await supabase.storage.from(ORDER_BUCKET).remove(order.photo_paths)
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (error) return toast(errorMessage(error), 'error')
    toast('Order deleted')
    onDeleted(order.id)
  }

  return (
    <Modal open onClose={onClose} title={`Order FS-${order.order_no}`} wide>
      <div className="detail-grid">
        <section>
          <h4 className="detail-h">Customer</h4>
          <p className="detail-big">{order.customer_name}</p>
          <p>
            <a href={`tel:${order.phone}`}>{order.phone}</a>
          </p>
          <div className="detail-actions">
            <a className="btn btn-outline btn-sm" href={`tel:${order.phone}`}>
              <IconPhone size={16} /> Call
            </a>
            <a className="btn btn-outline btn-sm" href={whatsappLink(order.phone)} target="_blank" rel="noreferrer">
              <IconWhatsapp size={16} /> WhatsApp
            </a>
          </div>
          <h4 className="detail-h">Address</h4>
          <p className="pre">
            {order.address}
            {order.pincode && ` – ${order.pincode}`}
          </p>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              navigator.clipboard
                .writeText(`${order.customer_name}\n${order.phone}\n${order.address}${order.pincode ? ' - ' + order.pincode : ''}`)
                .then(() => toast('Address copied'))
            }
          >
            Copy address
          </button>
        </section>

        <section>
          <h4 className="detail-h">Order</h4>
          <p className="detail-big">{order.product_title}</p>
          <table className="kv">
            <tbody>
              {order.size_label && (
                <tr>
                  <th>Size</th>
                  <td>{order.size_label}</td>
                </tr>
              )}
              <tr>
                <th>Quantity</th>
                <td>{order.quantity}</td>
              </tr>
              <tr>
                <th>Price</th>
                <td>{order.unit_price ? formatPrice(order.unit_price) : 'On request'}</td>
              </tr>
              <tr>
                <th>Total</th>
                <td>
                  <strong>{order.total ? formatPrice(order.total) : '—'}</strong>
                </td>
              </tr>
              <tr>
                <th>Placed</th>
                <td>{formatDate(order.created_at)}</td>
              </tr>
            </tbody>
          </table>
          {order.notes && (
            <>
              <h4 className="detail-h">Customer notes</h4>
              <p className="pre note-box">{order.notes}</p>
            </>
          )}
        </section>
      </div>

      <h4 className="detail-h">Photos ({order.photo_paths?.length || 0})</h4>
      {photos === null ? (
        <Spinner />
      ) : photos.length === 0 ? (
        <p className="muted">No photos uploaded.</p>
      ) : (
        <div className="photo-thumbs order-photos">
          {photos.map((p, i) => (
            <div key={p.path} className="photo-thumb">
              <a href={p.view} target="_blank" rel="noreferrer">
                <img src={p.view} alt={`Photo ${i + 1}`} />
              </a>
              <a className="thumb-dl" href={p.download} aria-label={`Download photo ${i + 1}`}>
                <IconDownload size={14} />
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="detail-grid detail-manage">
        <Field label="Status">
          <select value={order.status} disabled={saving} onChange={(e) => update({ status: e.target.value }, 'Status updated')}>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Private notes (only you see these)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>
      </div>
      <div className="detail-foot">
        <button className="btn btn-danger btn-sm" onClick={remove}>
          <IconTrash size={16} /> Delete order
        </button>
        <button
          className="btn btn-primary btn-sm"
          disabled={saving || notes === (order.admin_notes || '')}
          onClick={() => update({ admin_notes: notes }, 'Notes saved')}
        >
          Save notes
        </button>
      </div>
    </Modal>
  )
}

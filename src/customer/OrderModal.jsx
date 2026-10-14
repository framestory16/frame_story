import { useEffect, useRef, useState } from 'react'
import { supabase, ORDER_BUCKET } from '@shared/supabase.js'
import { compressImage, fileExtension, formatPrice, digitsOnly, errorMessage } from '@shared/utils.js'
import { Modal, Field } from '@shared/ui.jsx'
import { IconUpload, IconX, IconCheck, IconMinus, IconPlus } from '@shared/icons.jsx'
import { useShop } from './store.jsx'

const EMPTY = { name: '', phone: '', address: '', pincode: '', notes: '' }
const MAX_FILE_MB = 15

function validate(form) {
  const e = {}
  if (form.name.trim().length < 2) e.name = 'Please enter your name'
  const d = digitsOnly(form.phone)
  if (d.length < 10 || d.length > 13) e.phone = 'Please enter a valid 10-digit mobile number'
  if (form.address.trim().length < 10) e.address = 'Please enter your full delivery address'
  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Pincode should be 6 digits'
  return e
}

export default function OrderModal({ open, onClose, product, size }) {
  const { settings } = useShop()
  const [form, setForm] = useState(EMPTY)
  const [qty, setQty] = useState(1)
  const [photos, setPhotos] = useState([]) // { file, url }
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('') // progress text while submitting
  const [submitError, setSubmitError] = useState('')
  const [orderNo, setOrderNo] = useState(null)
  const [drag, setDrag] = useState(false)
  const fileInput = useRef(null)

  const maxPhotos = product.allow_photo_upload ? product.max_photos : 0
  const unitPrice = size ? size.price : product.price
  const hasPrice = unitPrice !== null && unitPrice !== undefined && unitPrice !== ''
  const submitting = !!status

  useEffect(() => {
    if (!open) return
    setErrors({})
    setSubmitError('')
    setOrderNo(null)
  }, [open])

  // Release preview URLs when the modal unmounts.
  const photosRef = useRef(photos)
  photosRef.current = photos
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function addFiles(list) {
    setSubmitError('')
    const incoming = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024)
    const ok = incoming.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024)
    const room = maxPhotos - photos.length
    if (tooBig.length) setSubmitError(`Some photos are larger than ${MAX_FILE_MB} MB and were skipped.`)
    if (ok.length > room) setSubmitError(`You can upload up to ${maxPhotos} photos for this item.`)
    const next = ok.slice(0, Math.max(0, room)).map((file) => ({ file, url: URL.createObjectURL(file) }))
    if (next.length) setPhotos((p) => [...p, ...next])
  }

  function removePhoto(i) {
    URL.revokeObjectURL(photos[i].url)
    setPhotos((p) => p.filter((_, idx) => idx !== i))
  }

  async function submit(e) {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    if (Object.keys(v).length) return
    setSubmitError('')

    try {
      const folder = crypto.randomUUID()
      const paths = []
      for (let i = 0; i < photos.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${photos.length}…`)
        const small = await compressImage(photos[i].file, { maxSize: 2400, quality: 0.9 })
        const path = `${folder}/${i + 1}.${fileExtension(small)}`
        const { error } = await supabase.storage
          .from(ORDER_BUCKET)
          .upload(path, small, { contentType: small.type || 'image/jpeg' })
        if (error) throw error
        paths.push(path)
      }

      setStatus('Placing your order…')
      const { data, error } = await supabase.rpc('create_order', {
        p_product_id: product.id,
        p_size: size?.label || null,
        p_quantity: qty,
        p_customer_name: form.name,
        p_phone: form.phone,
        p_address: form.address,
        p_pincode: form.pincode,
        p_notes: form.notes,
        p_photo_paths: paths,
      })
      if (error) throw error

      setOrderNo(data)
      setForm(EMPTY)
      photos.forEach((p) => URL.revokeObjectURL(p.url))
      setPhotos([])
      setQty(1)
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setStatus('')
    }
  }

  if (orderNo) {
    return (
      <Modal open={open} onClose={onClose} title="Order placed">
        <div className="order-success">
          <span className="success-icon">
            <IconCheck size={34} />
          </span>
          <h3>Thank you! 🤍</h3>
          <p className="order-id">
            Your order ID is <strong>{orderNo}</strong>
          </p>
          <p className="muted">{settings.order_success_message}</p>
          <button className="btn btn-primary" onClick={onClose}>
            Continue shopping
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={submitting ? undefined : onClose} title="Place your order">
      <form onSubmit={submit} noValidate>
        <div className="order-summary">
          {product.images?.[0] && <img src={product.images[0]} alt="" />}
          <div>
            <strong>{product.title}</strong>
            {size && <span className="muted"> · {size.label}</span>}
            <div className="qty-row">
              <div className="qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  <IconMinus size={16} />
                </button>
                <span aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Increase quantity">
                  <IconPlus size={16} />
                </button>
              </div>
              <span className="order-total">{hasPrice ? formatPrice(unitPrice * qty) : 'Price on request'}</span>
            </div>
          </div>
        </div>

        <Field label="Your name" required error={errors.name}>
          <input value={form.name} onChange={set('name')} autoComplete="name" maxLength={80} />
        </Field>
        <Field label="Mobile number" required error={errors.phone} hint="We'll call or WhatsApp you to confirm">
          <input
            value={form.phone}
            onChange={set('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            placeholder="98765 43210"
          />
        </Field>
        <Field label="Delivery address" required error={errors.address}>
          <textarea
            value={form.address}
            onChange={set('address')}
            autoComplete="street-address"
            rows={3}
            maxLength={500}
            placeholder="House no, street, area, city"
          />
        </Field>
        <Field label="Pincode" error={errors.pincode}>
          <input
            value={form.pincode}
            onChange={set('pincode')}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
          />
        </Field>

        {maxPhotos > 0 && (
          <div className="field">
            <span className="field-label">
              Your photos{' '}
              <span className="muted">
                ({photos.length}/{maxPhotos})
              </span>
            </span>
            {photos.length < maxPhotos && (
              <div
                className={`dropzone ${drag ? 'drag' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDrag(true)
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDrag(false)
                  addFiles(e.dataTransfer.files)
                }}
              >
                <IconUpload size={24} />
                <span>Tap to choose photos</span>
                <small>JPG, PNG or HEIC · up to {maxPhotos}</small>
              </div>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
            {photos.length > 0 && (
              <div className="photo-thumbs" style={{ marginTop: 10 }}>
                {photos.map((p, i) => (
                  <div className="photo-thumb" key={p.url}>
                    <img src={p.url} alt={`Photo ${i + 1}`} />
                    <button type="button" className="thumb-remove" onClick={() => removePhoto(i)} aria-label="Remove photo">
                      <IconX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Field label="Notes / message" hint="Name or date to print, colour preference, delivery date…">
          <textarea value={form.notes} onChange={set('notes')} rows={2} maxLength={1000} />
        </Field>

        {submitError && <div className="alert alert-error">{submitError}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner" /> {status}
            </>
          ) : (
            'Place order'
          )}
        </button>
        <p className="order-fine">No payment now — we'll contact you to confirm your order.</p>
      </form>
    </Modal>
  )
}

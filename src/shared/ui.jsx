import { useEffect } from 'react'
import { IconX } from './icons.jsx'

export function Modal({ open, onClose, title, children, wide = false, footer = null }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <IconX />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Spinner({ label }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      {label && <span>{label}</span>}
    </div>
  )
}

export function Field({ label, hint, error, children, required }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && <span className="req"> *</span>}
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span>{label}</span>
    </label>
  )
}

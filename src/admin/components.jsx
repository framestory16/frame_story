import { useRef, useState } from 'react'
import { uploadSiteImage, errorMessage } from '@shared/utils.js'
import { IconUpload, IconX, IconArrowLeft, IconArrowRight } from '@shared/icons.jsx'
import { useToast } from './toast.jsx'

// Single image (category cover, banner).
export function ImagePicker({ value, onChange, folder, label = 'Upload image', aspect = '4 / 5' }) {
  const toast = useToast()
  const input = useRef(null)
  const [busy, setBusy] = useState(false)

  async function pick(file) {
    if (!file) return
    setBusy(true)
    try {
      onChange(await uploadSiteImage(file, folder))
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
    setBusy(false)
  }

  return (
    <div className="image-picker">
      {value ? (
        <div className="image-picker-preview" style={{ aspectRatio: aspect }}>
          <img src={value} alt="" />
          <button type="button" className="thumb-remove" onClick={() => onChange(null)} aria-label="Remove image">
            <IconX size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="dropzone"
          style={{ aspectRatio: aspect, width: '100%' }}
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          {busy ? <span className="spinner" /> : <IconUpload size={22} />}
          <span>{busy ? 'Uploading…' : label}</span>
        </button>
      )}
      {value && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : 'Change image'}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

// Multiple images with reordering (first = cover).
export function ImagesEditor({ value, onChange, folder, max = 10 }) {
  const toast = useToast()
  const input = useRef(null)
  const [busy, setBusy] = useState('')

  async function pick(files) {
    const list = Array.from(files).slice(0, max - value.length)
    let next = [...value]
    for (let i = 0; i < list.length; i++) {
      setBusy(`Uploading ${i + 1}/${list.length}…`)
      try {
        next = [...next, await uploadSiteImage(list[i], folder)]
        onChange(next)
      } catch (err) {
        toast(errorMessage(err), 'error')
      }
    }
    setBusy('')
  }

  function move(i, dir) {
    const next = [...value]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      <div className="images-grid">
        {value.map((src, i) => (
          <div key={src} className="images-item">
            <img src={src} alt="" />
            {i === 0 && <span className="cover-tag">Cover</span>}
            <button type="button" className="thumb-remove" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove">
              <IconX size={14} />
            </button>
            <div className="images-move">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left">
                <IconArrowLeft size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move right">
                <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button type="button" className="dropzone images-add" onClick={() => input.current?.click()} disabled={!!busy}>
            {busy ? <span className="spinner" /> : <IconUpload size={22} />}
            <span>{busy || 'Add photos'}</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

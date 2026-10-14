import { useEffect, useState } from 'react'
import { supabase } from '@shared/supabase.js'
import { errorMessage, deleteSiteImages } from '@shared/utils.js'
import { Spinner, Field } from '@shared/ui.jsx'
import { ImagePicker } from '../components.jsx'
import { useToast } from '../toast.jsx'

const FIELDS = [
  'shop_name',
  'tagline',
  'hero_title',
  'hero_subtitle',
  'banner_url',
  'announcement',
  'instagram',
  'phone',
  'city',
  'order_success_message',
]

export default function Settings() {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [original, setOriginal] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) return toast(errorMessage(error), 'error')
        setForm({ ...data, shop_url: data.extra?.shop_url || '' })
        setOriginal(data)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!form) return <Spinner />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    const payload = {}
    FIELDS.forEach((k) => (payload[k] = typeof form[k] === 'string' ? form[k].trim() || null : form[k] ?? null))
    payload.shop_name = payload.shop_name || 'The Frame Story'
    payload.extra = { ...(original.extra || {}), shop_url: form.shop_url.trim() }
    const { data, error } = await supabase.from('settings').update(payload).eq('id', 1).select().single()
    setBusy(false)
    if (error) return toast(errorMessage(error), 'error')
    if (original.banner_url && original.banner_url !== data.banner_url) deleteSiteImages([original.banner_url])
    setOriginal(data)
    toast('Settings saved')
  }

  return (
    <form className="page" onSubmit={save}>
      <div className="page-bar">
        <div>
          <h1>Settings</h1>
          <p className="muted">Text and images shown on the shop website.</p>
        </div>
        <button className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      <div className="edit-grid">
        <div className="panel">
          <h3>Home page</h3>
          <Field label="Main heading">
            <input value={form.hero_title || ''} onChange={set('hero_title')} />
          </Field>
          <Field label="Sub heading">
            <input value={form.hero_subtitle || ''} onChange={set('hero_subtitle')} />
          </Field>
          <Field label="Announcement bar" hint="Shown at the very top, e.g. “Free delivery in Chennai above ₹999”. Leave empty to hide.">
            <input value={form.announcement || ''} onChange={set('announcement')} />
          </Field>
          <span className="field-label">Home page picture</span>
          <p className="muted small">Square photo of your best work. If empty, the logo is shown.</p>
          <div className="banner-picker">
            <ImagePicker
              value={form.banner_url}
              onChange={(v) => setForm((f) => ({ ...f, banner_url: v }))}
              folder="banner"
              label="Upload picture"
              aspect="1 / 1"
            />
          </div>
        </div>

        <div className="panel">
          <h3>Shop details</h3>
          <Field label="Shop name">
            <input value={form.shop_name || ''} onChange={set('shop_name')} />
          </Field>
          <Field label="Tagline" hint="Shown in the footer">
            <input value={form.tagline || ''} onChange={set('tagline')} />
          </Field>
          <Field label="Instagram username">
            <input value={form.instagram || ''} onChange={set('instagram')} placeholder="_the__frame__story" />
          </Field>
          <Field label="Phone (optional)" hint="Shown in the footer if filled">
            <input value={form.phone || ''} onChange={set('phone')} type="tel" />
          </Field>
          <Field label="City">
            <input value={form.city || ''} onChange={set('city')} />
          </Field>
          <Field label="Message after an order is placed">
            <textarea value={form.order_success_message || ''} onChange={set('order_success_message')} rows={3} />
          </Field>
          <Field label="Shop website address" hint="Adds a “View shop” link in the admin menu">
            <input value={form.shop_url} onChange={set('shop_url')} placeholder="https://theframestory.pages.dev" />
          </Field>
        </div>
      </div>
    </form>
  )
}

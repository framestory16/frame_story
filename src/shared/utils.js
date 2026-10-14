import { supabase, SITE_BUCKET } from './supabase.js'

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return ''
  return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export function sizePrices(product) {
  return (product.sizes || [])
    .map((s) => (s.price === '' || s.price === null || s.price === undefined ? null : Number(s.price)))
    .filter((p) => p !== null && !Number.isNaN(p))
}

export function priceLabel(product) {
  const prices = sizePrices(product)
  if (prices.length) {
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? formatPrice(min) : `From ${formatPrice(min)}`
  }
  if (product.price !== null && product.price !== undefined) return formatPrice(product.price)
  return 'Price on request'
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Shrink photos in the browser before upload so free storage lasts longer.
// Falls back to the original file if the browser can't decode it (e.g. HEIC).
export async function compressImage(file, { maxSize = 1800, quality = 0.85 } = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export function fileExtension(file) {
  const fromName = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (fromName && fromName.length <= 5) return fromName
  return (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
}

// Upload an image to the public "site" bucket and return its public URL.
export async function uploadSiteImage(file, folder) {
  const small = await compressImage(file)
  const path = `${folder}/${crypto.randomUUID()}.${fileExtension(small)}`
  const { error } = await supabase.storage
    .from(SITE_BUCKET)
    .upload(path, small, { contentType: small.type, cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from(SITE_BUCKET).getPublicUrl(path).data.publicUrl
}

// Delete images from the "site" bucket given their public URLs (ignores foreign URLs).
export async function deleteSiteImages(urls) {
  const marker = `/storage/v1/object/public/${SITE_BUCKET}/`
  const paths = urls
    .filter((u) => u && u.includes(marker))
    .map((u) => decodeURIComponent(u.split(marker)[1]))
  if (paths.length) await supabase.storage.from(SITE_BUCKET).remove(paths)
}

export const ORDER_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function statusLabel(value) {
  return ORDER_STATUSES.find((s) => s.value === value)?.label || value
}

export function digitsOnly(text) {
  return String(text || '').replace(/[^0-9]/g, '')
}

export function whatsappLink(phone) {
  let d = digitsOnly(phone)
  if (d.length === 10) d = '91' + d
  return `https://wa.me/${d}`
}

export function instagramUrl(handle) {
  const h = String(handle || '').replace(/^@/, '').trim()
  return h ? `https://www.instagram.com/${h}/` : null
}

export function errorMessage(err) {
  if (!err) return 'Something went wrong. Please try again.'
  if (typeof err === 'string') return err
  return err.message || err.error_description || 'Something went wrong. Please try again.'
}

// Path to a file in /public that also works when the site lives in a sub-folder
// (e.g. GitHub Pages: /frame_story/).
export function asset(name) {
  return import.meta.env.BASE_URL + name
}

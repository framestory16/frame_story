import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@shared/supabase.js'

const ShopContext = createContext(null)

const DEFAULT_SETTINGS = {
  shop_name: 'The Frame Story',
  tagline: 'Framing your moments with love 🤍',
  hero_title: 'Framing your moments with love',
  hero_subtitle: 'Photo frames · Wall frames · Bouquets · Polaroids',
  instagram: '_the__frame__story',
  city: 'Chennai',
}

// Settings + categories are loaded once and shared by every page.
export function ShopProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order').order('name'),
    ]).then(([s, c]) => {
      if (!alive) return
      if (s.error || c.error) setError(s.error || c.error)
      if (s.data) setSettings({ ...DEFAULT_SETTINGS, ...s.data })
      setCategories(c.data || [])
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <ShopContext.Provider value={{ settings, categories, loading, error }}>{children}</ShopContext.Provider>
  )
}

export const useShop = () => useContext(ShopContext)

// Small helper for page-level queries.
export function useQuery(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    fn().then(({ data, error }) => alive && setState({ data, error, loading: false }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

export const PRODUCT_FIELDS =
  'id, title, description, price, compare_price, sizes, images, allow_photo_upload, max_photos, is_featured, category_id, categories(name, slug)'

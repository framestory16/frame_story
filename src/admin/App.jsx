import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { asset } from '@shared/utils.js'
import { Spinner } from '@shared/ui.jsx'
import { IconBox, IconGrid, IconFrame, IconSettings, IconLogout, IconExternal } from '@shared/icons.jsx'
import Login from './Login.jsx'
import Orders from './pages/Orders.jsx'
import Categories from './pages/Categories.jsx'
import Products from './pages/Products.jsx'
import ProductEdit from './pages/ProductEdit.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setIsAdmin(null)
      return
    }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(!!data))
  }, [session?.user?.id])

  if (session === undefined || (session && isAdmin === null)) return <Spinner label="Loading…" />
  if (!session) return <Login />
  if (!isAdmin)
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Not authorised</h1>
          <p className="muted">
            {session.user.email} is not an admin. Ask the owner to add this account in Supabase.
          </p>
          <button className="btn btn-outline" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>
    )

  return <Shell email={session.user.email} />
}

function Shell({ email }) {
  const [newCount, setNewCount] = useState(0)
  const [shopUrl, setShopUrl] = useState('')

  async function refreshCount() {
    const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new')
    setNewCount(count || 0)
  }

  useEffect(() => {
    refreshCount()
    supabase
      .from('settings')
      .select('extra')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => setShopUrl(data?.extra?.shop_url || ''))
    const t = setInterval(refreshCount, 60000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="side-brand">
          <img src={asset('logo-192.png')} alt="" width="44" height="44" />
          <div>
            <strong>The Frame Story</strong>
            <span>Admin</span>
          </div>
        </div>
        <nav className="side-nav">
          <NavLink to="/orders">
            <IconBox /> <span>Orders</span>
            {newCount > 0 && <span className="count">{newCount}</span>}
          </NavLink>
          <NavLink to="/products">
            <IconFrame /> <span>Products</span>
          </NavLink>
          <NavLink to="/categories">
            <IconGrid /> <span>Categories</span>
          </NavLink>
          <NavLink to="/settings">
            <IconSettings /> <span>Settings</span>
          </NavLink>
        </nav>
        <div className="side-foot">
          {shopUrl && (
            <a href={shopUrl} target="_blank" rel="noreferrer" className="side-link">
              <IconExternal size={18} /> View shop
            </a>
          )}
          <div className="side-user" title={email}>
            {email}
          </div>
          <button className="side-link" onClick={() => supabase.auth.signOut()}>
            <IconLogout size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<Orders onChange={refreshCount} />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductEdit />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </main>
    </div>
  )
}

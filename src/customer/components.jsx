import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useShop } from './store.jsx'
import { priceLabel, formatPrice, instagramUrl } from '@shared/utils.js'
import { IconInstagram, IconMenu, IconX, IconPhone, IconPin, IconArrowRight } from '@shared/icons.jsx'

export function Header() {
  const { settings, categories } = useShop()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const ig = instagramUrl(settings.instagram)

  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      {settings.announcement && <div className="announce">{settings.announcement}</div>}
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label={`${settings.shop_name} home`}>
            <img src="/logo-192.png" alt="" width="52" height="52" />
            <span className="brand-text">
              <span className="brand-name">{settings.shop_name}</span>
              <span className="brand-sub">Every frame tells a story</span>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Main">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/shop">Shop all</NavLink>
            {categories.slice(0, 4).map((c) => (
              <NavLink key={c.id} to={`/c/${c.slug}`}>
                {c.name}
              </NavLink>
            ))}
            {ig && (
              <a href={ig} target="_blank" rel="noreferrer" className="nav-ig" aria-label="Instagram">
                <IconInstagram />
              </a>
            )}
          </nav>

          <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>

        {open && (
          <nav className="mobile-nav" aria-label="Mobile">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/shop">Shop all</NavLink>
            {categories.map((c) => (
              <NavLink key={c.id} to={`/c/${c.slug}`}>
                {c.name}
              </NavLink>
            ))}
            {ig && (
              <a href={ig} target="_blank" rel="noreferrer">
                <IconInstagram size={18} /> Instagram
              </a>
            )}
          </nav>
        )}
      </header>
    </>
  )
}

export function Footer() {
  const { settings, categories } = useShop()
  const ig = instagramUrl(settings.instagram)
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/logo-192.png" alt={settings.shop_name} width="72" height="72" />
          <p className="footer-tagline">{settings.tagline}</p>
        </div>
        <div>
          <h4>Collections</h4>
          <ul>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/c/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
            <li>
              <Link to="/shop">Shop all</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Say hello</h4>
          <ul className="footer-contact">
            {ig && (
              <li>
                <a href={ig} target="_blank" rel="noreferrer">
                  <IconInstagram size={18} /> @{settings.instagram.replace(/^@/, '')}
                </a>
              </li>
            )}
            {settings.phone && (
              <li>
                <a href={`tel:${settings.phone}`}>
                  <IconPhone size={18} /> {settings.phone}
                </a>
              </li>
            )}
            {settings.city && (
              <li>
                <span>
                  <IconPin size={18} /> {settings.city}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} {settings.shop_name} · Made with 🤍
      </div>
    </footer>
  )
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function CategoryCard({ category }) {
  return (
    <Link to={`/c/${category.slug}`} className="cat-card">
      <div className="cat-media">
        {category.image_url ? (
          <img src={category.image_url} alt="" loading="lazy" />
        ) : (
          <div className="cat-placeholder">
            <img src="/logo-512.png" alt="" loading="lazy" />
          </div>
        )}
      </div>
      <div className="cat-info">
        <h3>{category.name}</h3>
        {category.description && <p>{category.description}</p>}
        <span className="cat-cta">
          Explore <IconArrowRight size={16} />
        </span>
      </div>
    </Link>
  )
}

export function ProductCard({ product }) {
  const img = product.images?.[0]
  const showCompare =
    product.compare_price && !product.sizes?.length && product.price && product.compare_price > product.price
  return (
    <Link to={`/p/${product.id}`} className="product-card">
      <div className="product-media">
        {img ? (
          <img src={img} alt={product.title} loading="lazy" />
        ) : (
          <div className="cat-placeholder">
            <img src="/logo-512.png" alt="" loading="lazy" />
          </div>
        )}
        {product.is_featured && <span className="badge product-badge">Bestseller</span>}
      </div>
      <div className="product-info">
        {product.categories?.name && <span className="product-cat">{product.categories.name}</span>}
        <h3>{product.title}</h3>
        <div className="product-price">
          <span>{priceLabel(product)}</span>
          {showCompare && <s>{formatPrice(product.compare_price)}</s>}
        </div>
      </div>
    </Link>
  )
}

export function ProductGrid({ products }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-card skeleton">
          <div className="product-media" />
          <div className="product-info">
            <div className="sk-line" />
            <div className="sk-line short" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <img src="/logo-192.png" alt="" width="84" height="84" />
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useShop } from './store.jsx'
import { priceLabel, formatPrice, instagramUrl, asset } from '@shared/utils.js'
import { IconInstagram, IconMenu, IconX, IconPhone, IconPin, IconArrowRight } from '@shared/icons.jsx'

// Fades/slides children in when they scroll into view.
export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function Header() {
  const { settings, categories } = useShop()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const ig = instagramUrl(settings.instagram)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {settings.announcement && <div className="announce">{settings.announcement}</div>}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label={`${settings.shop_name} home`}>
            <img src={asset('logo-192.png')} alt="" width="52" height="52" />
            <span className="brand-text">
              <span className="brand-name">{settings.shop_name}</span>
              <span className="brand-sub">Every frame tells a story</span>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Main">
            <NavLink to="/" end>
              Home
            </NavLink>
            {categories.slice(0, 4).map((c) => (
              <NavLink key={c.id} to={`/c/${c.slug}`}>
                {c.name}
              </NavLink>
            ))}
            <NavLink to="/shop">Shop all</NavLink>
          </nav>

          <div className="header-actions">
            {ig && (
              <a href={ig} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm header-cta">
                <IconInstagram size={16} /> <span>Follow</span>
              </a>
            )}
            <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              {open ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        <nav className={`mobile-nav ${open ? 'open' : ''}`} aria-label="Mobile" aria-hidden={!open}>
          <NavLink to="/" end>
            Home
          </NavLink>
          {categories.map((c) => (
            <NavLink key={c.id} to={`/c/${c.slug}`}>
              {c.name}
            </NavLink>
          ))}
          <NavLink to="/shop">Shop all</NavLink>
          {ig && (
            <a href={ig} target="_blank" rel="noreferrer">
              <IconInstagram size={18} /> Instagram
            </a>
          )}
        </nav>
      </header>
    </>
  )
}

export function Footer() {
  const { settings, categories } = useShop()
  const ig = instagramUrl(settings.instagram)
  return (
    <footer className="site-footer">
      <img src={asset('floral.png')} alt="" className="footer-floral" aria-hidden="true" loading="lazy" />
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src={asset('logo-512.png')} alt={settings.shop_name} width="120" height="120" loading="lazy" />
          <p className="footer-tagline">{settings.tagline}</p>
          {ig && (
            <a href={ig} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <IconInstagram size={16} /> @{settings.instagram.replace(/^@/, '')}
            </a>
          )}
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
                  <IconInstagram size={18} /> DM us on Instagram
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
        <span>
          © {new Date().getFullYear()} {settings.shop_name}
        </span>
        <span className="script">made with love 🤍</span>
      </div>
    </footer>
  )
}

export function FloatingInstagram() {
  const { settings } = useShop()
  const { pathname } = useLocation()
  const ig = instagramUrl(settings.instagram)
  if (!ig || pathname.startsWith('/p/')) return null
  return (
    <a href={ig} target="_blank" rel="noreferrer" className="float-ig" aria-label="Message us on Instagram">
      <IconInstagram size={22} />
      <span>DM us</span>
    </a>
  )
}

export function SectionTitle({ eyebrow, title, text, action, center = false }) {
  return (
    <Reveal className={`section-title ${center ? 'center' : ''}`}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {text && <p className="section-text">{text}</p>}
      </div>
      {action}
    </Reveal>
  )
}

export function Marquee({ items }) {
  const row = items.map((t, i) => (
    <span key={i} className="marquee-item">
      {t} <span className="marquee-dot">✿</span>
    </span>
  ))
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  )
}

export function CategoryCard({ category, index }) {
  return (
    <Link to={`/c/${category.slug}`} className="cat-card">
      <div className="cat-arch">
        {category.image_url ? (
          <img src={category.image_url} alt="" loading="lazy" />
        ) : (
          <div className="cat-placeholder">
            <img src={asset('floral.png')} alt="" loading="lazy" />
          </div>
        )}
        <span className="cat-num">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="cat-info">
        <h3>{category.name}</h3>
        {category.description && <p>{category.description}</p>}
        <span className="cat-cta">
          Explore <IconArrowRight size={15} />
        </span>
      </div>
    </Link>
  )
}

export function ProductCard({ product }) {
  const [img, hoverImg] = product.images || []
  const showCompare =
    product.compare_price && !product.sizes?.length && product.price && product.compare_price > product.price
  return (
    <Link to={`/p/${product.id}`} className="product-card">
      <div className="product-mat">
        <div className="product-media">
          {img ? (
            <>
              <img src={img} alt={product.title} loading="lazy" className="img-main" />
              {hoverImg && <img src={hoverImg} alt="" loading="lazy" className="img-hover" />}
            </>
          ) : (
            <div className="cat-placeholder">
              <img src={asset('floral.png')} alt="" loading="lazy" />
            </div>
          )}
          <span className="product-quick">
            View & order <IconArrowRight size={14} />
          </span>
        </div>
        {product.is_featured && <span className="product-badge">Bestseller</span>}
        {showCompare && <span className="product-badge sale">Offer</span>}
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
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) * 70}>
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-card skeleton">
          <div className="product-mat">
            <div className="product-media" />
          </div>
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
      <img src={asset('floral.png')} alt="" width="90" className="empty-floral" />
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  )
}

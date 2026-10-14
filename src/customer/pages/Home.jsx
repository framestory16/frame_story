import { Link } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { instagramUrl } from '@shared/utils.js'
import { IconInstagram, IconArrowRight, IconFrame, IconUpload, IconHeart } from '@shared/icons.jsx'
import { useShop, useQuery, PRODUCT_FIELDS } from '../store.jsx'
import { SectionTitle, CategoryCard, ProductGrid, SkeletonGrid, EmptyState } from '../components.jsx'

export default function Home() {
  const { settings, categories, loading: shopLoading } = useShop()
  const ig = instagramUrl(settings.instagram)

  // Featured first, then newest.
  const products = useQuery(
    () =>
      supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('sort_order')
        .order('created_at', { ascending: false })
        .limit(8),
    []
  )

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="eyebrow">Handcrafted in {settings.city || 'Chennai'}</span>
            <h1>{settings.hero_title}</h1>
            <p className="hero-sub">{settings.hero_subtitle}</p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary">
                Shop now <IconArrowRight size={18} />
              </Link>
              <a href="#collections" className="btn btn-outline">
                View collections
              </a>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-frame">
              <img
                src={settings.banner_url || '/logo-1024.jpg'}
                alt={settings.shop_name}
                className={settings.banner_url ? 'hero-banner' : 'hero-logo'}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="collections">
        <div className="container">
          <SectionTitle eyebrow="Our collections" title="Find the perfect frame" />
          {shopLoading ? (
            <SkeletonGrid count={4} />
          ) : categories.length ? (
            <div className="cat-grid">
              {categories.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
          ) : (
            <EmptyState title="Collections coming soon" text="We're setting things up — check back shortly." />
          )}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <SectionTitle
            eyebrow="Loved by our customers"
            title="Bestsellers & new arrivals"
            action={
              <Link to="/shop" className="link-arrow">
                See all <IconArrowRight size={16} />
              </Link>
            }
          />
          {products.loading ? (
            <SkeletonGrid count={4} />
          ) : products.data?.length ? (
            <ProductGrid products={products.data} />
          ) : (
            <EmptyState title="New designs coming soon" text="Follow us on Instagram for the latest work." />
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionTitle eyebrow="How it works" title="Your memories, beautifully framed" />
          <div className="steps">
            <div className="step">
              <span className="step-icon">
                <IconFrame size={26} />
              </span>
              <h3>1. Pick your style</h3>
              <p>Choose a frame, polaroid set or bouquet and the size you love.</p>
            </div>
            <div className="step">
              <span className="step-icon">
                <IconUpload size={26} />
              </span>
              <h3>2. Share your photos</h3>
              <p>Upload your favourite pictures and tell us any special message.</p>
            </div>
            <div className="step">
              <span className="step-icon">
                <IconHeart size={26} />
              </span>
              <h3>3. We craft with love</h3>
              <p>We call to confirm, then handcraft and deliver your story.</p>
            </div>
          </div>
        </div>
      </section>

      {ig && (
        <section className="ig-band">
          <div className="container ig-inner">
            <div>
              <h2>Follow our story</h2>
              <p>See our latest frames and happy customers on Instagram.</p>
            </div>
            <a href={ig} target="_blank" rel="noreferrer" className="btn btn-primary">
              <IconInstagram size={18} /> @{settings.instagram.replace(/^@/, '')}
            </a>
          </div>
        </section>
      )}
    </>
  )
}

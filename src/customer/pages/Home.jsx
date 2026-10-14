import { Link } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { instagramUrl, asset } from '@shared/utils.js'
import { IconInstagram, IconArrowRight, IconFrame, IconUpload, IconHeart, IconImage } from '@shared/icons.jsx'
import { useShop, useQuery, PRODUCT_FIELDS } from '../store.jsx'
import {
  SectionTitle,
  CategoryCard,
  ProductGrid,
  SkeletonGrid,
  EmptyState,
  Marquee,
  Reveal,
} from '../components.jsx'

// Puts the last word of the heading in rose-gold script, e.g. "…with *love*".
function AccentTitle({ text }) {
  const words = String(text || '').trim().split(/\s+/)
  if (words.length < 2) return <>{text}</>
  const last = words.pop()
  return (
    <>
      {words.join(' ')} <span className="accent">{last}</span>
    </>
  )
}

function Polaroid({ src, caption, className, contain = false }) {
  return (
    <figure className={`polaroid ${className}`}>
      <div className="polaroid-img">
        {src ? (
          <img src={src} alt="" className={contain ? 'contain' : ''} />
        ) : (
          <div className="polaroid-fill">
            <img src={asset('floral.png')} alt="" />
          </div>
        )}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

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

  const productPics = (products.data || []).map((p) => p.images?.[0]).filter(Boolean)
  const heroMain = settings.banner_url || productPics[0] || null
  const heroSmall = settings.banner_url ? productPics.slice(0, 2) : productPics.slice(1, 3)
  const catNames = categories.map((c) => c.name)
  const marqueeItems = [
    ...(catNames.length ? catNames : ['Photo frames', 'Wall frames', 'Bouquets', 'Polaroids']),
    'Personalised gifts',
    `Handcrafted in ${settings.city || 'Chennai'}`,
    'Every frame tells a story',
  ]

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-text">
            <span className="pill">✿ Handcrafted in {settings.city || 'Chennai'}</span>
            <h1>
              <AccentTitle text={settings.hero_title} />
            </h1>
            <p className="hero-sub">{settings.hero_subtitle}</p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary btn-lg">
                Shop the collection <IconArrowRight size={18} />
              </Link>
              <a href="#collections" className="btn btn-outline btn-lg">
                Explore categories
              </a>
            </div>
            {categories.length > 0 && (
              <div className="hero-quick">
                {categories.slice(0, 4).map((c) => (
                  <Link key={c.id} to={`/c/${c.slug}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="hero-art" aria-hidden="true">
            <img src={asset('floral.png')} alt="" className="hero-floral f1" />
            <img src={asset('floral.png')} alt="" className="hero-floral f2" />
            <div className="hero-frame-lines" />
            <Polaroid
              className="p-main"
              src={heroMain || asset('logo-1024.jpg')}
              contain={!heroMain}
              caption="every frame tells a story"
            />
            <Polaroid className="p-left" src={heroSmall[0]} caption={catNames[0]?.toLowerCase() || 'memories'} />
            <Polaroid className="p-right" src={heroSmall[1]} caption={catNames[3]?.toLowerCase() || 'with love'} />
          </div>
        </div>
      </section>

      <Marquee items={marqueeItems} />

      {/* ---------- Collections ---------- */}
      <section className="section" id="collections">
        <div className="container">
          <SectionTitle
            center
            eyebrow="Our collections"
            title="Find the perfect frame"
            text="Thoughtfully handmade pieces to hold your favourite memories — for your walls, your desk or someone you love."
          />
          {shopLoading ? (
            <SkeletonGrid count={4} />
          ) : categories.length ? (
            <div className="cat-grid">
              {categories.map((c, i) => (
                <Reveal key={c.id} delay={(i % 4) * 90}>
                  <CategoryCard category={c} index={i} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title="Collections coming soon" text="We're setting things up — check back shortly." />
          )}
        </div>
      </section>

      {/* ---------- Promise strip ---------- */}
      <section className="promises">
        <div className="container promise-grid">
          {[
            { icon: <IconHeart size={22} />, title: 'Handcrafted with love', text: 'Each piece made by hand' },
            { icon: <IconImage size={22} />, title: 'Your photos, your story', text: 'Personalised just for you' },
            { icon: <IconFrame size={22} />, title: 'Made to order', text: 'Sizes & styles you choose' },
            { icon: <IconUpload size={22} />, title: 'Order in minutes', text: 'Upload photos right here' },
          ].map((p, i) => (
            <Reveal key={p.title} className="promise" delay={i * 80}>
              <span className="promise-icon">{p.icon}</span>
              <div>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Products ---------- */}
      <section className="section section-tint">
        <div className="container">
          <SectionTitle
            eyebrow="Loved by our customers"
            title="Bestsellers & new arrivals"
            action={
              <Link to="/shop" className="link-arrow">
                View all <IconArrowRight size={16} />
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

      {/* ---------- Quote ---------- */}
      <section className="quote-band">
        <img src={asset('floral.png')} alt="" className="quote-floral left" aria-hidden="true" loading="lazy" />
        <img src={asset('floral.png')} alt="" className="quote-floral right" aria-hidden="true" loading="lazy" />
        <Reveal className="container quote-inner">
          <span className="eyebrow">The Frame Story</span>
          <blockquote>“Some moments deserve more than a phone screen.”</blockquote>
          <p>Turn your favourite photos into keepsakes you can hold, hang and gift.</p>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Start your story <IconArrowRight size={18} />
          </Link>
        </Reveal>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section">
        <div className="container">
          <SectionTitle center eyebrow="How it works" title="Three simple steps" />
          <div className="steps">
            {[
              { icon: <IconFrame size={26} />, title: 'Pick your style', text: 'Choose a frame, polaroid set or bouquet in the size you love.' },
              { icon: <IconUpload size={26} />, title: 'Share your photos', text: 'Upload your favourite pictures and add a special message.' },
              { icon: <IconHeart size={26} />, title: 'We craft with love', text: 'We call to confirm, then handcraft and deliver your story.' },
            ].map((s, i) => (
              <Reveal key={s.title} className="step" delay={i * 120}>
                <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="step-icon">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Instagram ---------- */}
      {ig && (
        <section className="ig-band">
          <div className="container ig-inner">
            <Reveal className="ig-text">
              <span className="eyebrow light">Join our story</span>
              <h2>Follow @{settings.instagram.replace(/^@/, '')}</h2>
              <p>New designs, happy customers and behind-the-scenes — straight from our studio.</p>
              <a href={ig} target="_blank" rel="noreferrer" className="btn btn-light btn-lg">
                <IconInstagram size={18} /> Follow on Instagram
              </a>
            </Reveal>
            <div className="ig-polaroids" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <Polaroid
                  key={i}
                  className={`ig-p ig-p${i}`}
                  src={productPics[i] || (i === 1 ? asset('logo-512.png') : null)}
                  contain={!productPics[i] && i === 1}
                  caption={['memories', 'the frame story', 'with love'][i]}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

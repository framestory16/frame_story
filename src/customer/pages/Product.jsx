import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { formatPrice, priceLabel, asset } from '@shared/utils.js'
import { Spinner } from '@shared/ui.jsx'
import { IconUpload, IconHeart, IconPhone, IconArrowRight } from '@shared/icons.jsx'
import { useQuery, PRODUCT_FIELDS } from '../store.jsx'
import { EmptyState, ProductGrid, SectionTitle } from '../components.jsx'
import OrderModal from '../OrderModal.jsx'

export default function Product() {
  const { id } = useParams()
  const { data: product, loading } = useQuery(
    () => supabase.from('products').select(PRODUCT_FIELDS).eq('id', id).eq('is_active', true).maybeSingle(),
    [id]
  )
  const related = useQuery(
    () =>
      product?.category_id
        ? supabase
            .from('products')
            .select(PRODUCT_FIELDS)
            .eq('is_active', true)
            .eq('category_id', product.category_id)
            .neq('id', product.id)
            .order('is_featured', { ascending: false })
            .limit(4)
        : Promise.resolve({ data: [], error: null }),
    [product?.id]
  )
  const [imgIndex, setImgIndex] = useState(0)
  const [size, setSize] = useState(null)
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    setImgIndex(0)
    setSize(product?.sizes?.length === 1 ? product.sizes[0].label : null)
    if (product) document.title = `${product.title} — The Frame Story`
  }, [product])

  if (loading) return <Spinner />
  if (!product)
    return (
      <section className="section page-top">
        <div className="container">
          <EmptyState
            title="This item isn't available"
            action={
              <Link to="/shop" className="btn btn-primary">
                Browse the shop
              </Link>
            }
          />
        </div>
      </section>
    )

  const images = product.images?.length ? product.images : [asset('logo-1024.jpg')]
  const hasSizes = product.sizes?.length > 0
  const selected = hasSizes ? product.sizes.find((s) => s.label === size) : null
  const price = hasSizes ? (selected ? selected.price : null) : product.price
  const hasPrice = price !== null && price !== undefined && price !== ''
  const showCompare = !hasSizes && product.compare_price && product.price && product.compare_price > product.price
  const canOrder = !hasSizes || !!selected

  function startOrder() {
    if (canOrder) setOrdering(true)
    else document.getElementById('sizes')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <section className="section page-top pdp-section">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link> <span>/</span>{' '}
            {product.categories ? (
              <>
                <Link to={`/c/${product.categories.slug}`}>{product.categories.name}</Link> <span>/</span>{' '}
              </>
            ) : null}
            <span className="crumb-current">{product.title}</span>
          </nav>

          <div className="pdp">
            <div className="pdp-gallery">
              <div className="pdp-main">
                <img src={images[imgIndex]} alt={product.title} className={product.images?.length ? '' : 'contain'} />
              </div>
              {images.length > 1 && (
                <div className="pdp-thumbs">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      className={i === imgIndex ? 'active' : ''}
                      onClick={() => setImgIndex(i)}
                      aria-label={`Image ${i + 1}`}
                    >
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pdp-info">
              {product.categories?.name && <span className="eyebrow">{product.categories.name}</span>}
              <h1>{product.title}</h1>
              <div className="pdp-price">
                <span>{hasPrice ? formatPrice(price) : priceLabel(product)}</span>
                {showCompare && <s>{formatPrice(product.compare_price)}</s>}
                {showCompare && (
                  <span className="save-tag">
                    Save {Math.round((1 - product.price / product.compare_price) * 100)}%
                  </span>
                )}
              </div>

              {hasSizes && (
                <div className="pdp-sizes" id="sizes">
                  <span className="field-label">
                    Choose size {!selected && <span className="hint-inline">— select one</span>}
                  </span>
                  <div className="size-pills">
                    {product.sizes.map((s) => (
                      <button
                        key={s.label}
                        className={`size-pill ${size === s.label ? 'active' : ''}`}
                        onClick={() => setSize(s.label)}
                      >
                        <span>{s.label}</span>
                        {s.price !== '' && s.price !== null && s.price !== undefined && (
                          <small>{formatPrice(s.price)}</small>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-block btn-lg pdp-cta" onClick={startOrder}>
                {canOrder ? 'Order now' : 'Choose a size to order'} <IconArrowRight size={18} />
              </button>

              <div className="pdp-perks">
                {product.allow_photo_upload && product.max_photos > 0 && (
                  <div>
                    <IconUpload size={20} />
                    <span>
                      Upload up to <strong>{product.max_photos}</strong> photo{product.max_photos > 1 ? 's' : ''} in the
                      next step
                    </span>
                  </div>
                )}
                <div>
                  <IconHeart size={20} />
                  <span>Handcrafted to order, just for you</span>
                </div>
                <div>
                  <IconPhone size={20} />
                  <span>No payment now — we call you to confirm</span>
                </div>
              </div>

              {product.description && (
                <div className="pdp-desc">
                  <h3>Details</h3>
                  {product.description}
                </div>
              )}

              <div className="pdp-next">
                <h3>What happens next?</h3>
                <ol>
                  <li>You place the order and upload your photos</li>
                  <li>We call or WhatsApp you to confirm details & price</li>
                  <li>We handcraft your piece and deliver it with love</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.data?.length > 0 && (
        <section className="section section-tint">
          <div className="container">
            <SectionTitle eyebrow="You may also like" title={`More ${product.categories?.name || 'favourites'}`} />
            <ProductGrid products={related.data} />
          </div>
        </section>
      )}

      {/* Mobile sticky order bar */}
      <div className="sticky-order">
        <div>
          <span className="sticky-title">{product.title}</span>
          <strong>{hasPrice ? formatPrice(price) : priceLabel(product)}</strong>
        </div>
        <button className="btn btn-primary" onClick={startOrder}>
          {canOrder ? 'Order now' : 'Choose size'}
        </button>
      </div>

      <OrderModal open={ordering} onClose={() => setOrdering(false)} product={product} size={selected} />
    </>
  )
}

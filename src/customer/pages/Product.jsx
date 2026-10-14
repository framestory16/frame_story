import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@shared/supabase.js'
import { formatPrice, priceLabel } from '@shared/utils.js'
import { Spinner } from '@shared/ui.jsx'
import { IconUpload, IconHeart } from '@shared/icons.jsx'
import { useQuery, PRODUCT_FIELDS } from '../store.jsx'
import { EmptyState } from '../components.jsx'
import OrderModal from '../OrderModal.jsx'

export default function Product() {
  const { id } = useParams()
  const { data: product, loading } = useQuery(
    () => supabase.from('products').select(PRODUCT_FIELDS).eq('id', id).eq('is_active', true).maybeSingle(),
    [id]
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

  const images = product.images?.length ? product.images : ['/logo-1024.jpg']
  const hasSizes = product.sizes?.length > 0
  const selected = hasSizes ? product.sizes.find((s) => s.label === size) : null
  const price = hasSizes ? (selected ? selected.price : null) : product.price
  const showCompare = !hasSizes && product.compare_price && product.price && product.compare_price > product.price

  return (
    <section className="section page-top">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link> /{' '}
          {product.categories ? (
            <>
              <Link to={`/c/${product.categories.slug}`}>{product.categories.name}</Link> /{' '}
            </>
          ) : null}
          <span>{product.title}</span>
        </nav>

        <div className="pdp">
          <div className="pdp-gallery">
            <div className="pdp-main">
              <img src={images[imgIndex]} alt={product.title} />
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
              {price !== null && price !== undefined && price !== '' ? (
                <span>{formatPrice(price)}</span>
              ) : (
                <span>{priceLabel(product)}</span>
              )}
              {showCompare && <s>{formatPrice(product.compare_price)}</s>}
            </div>

            {hasSizes && (
              <div className="pdp-sizes">
                <span className="field-label">Choose size</span>
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

            <button
              className="btn btn-primary btn-block pdp-cta"
              disabled={hasSizes && !selected}
              onClick={() => setOrdering(true)}
            >
              {hasSizes && !selected ? 'Choose a size to order' : 'Order now'}
            </button>

            <ul className="pdp-notes">
              {product.allow_photo_upload && product.max_photos > 0 && (
                <li>
                  <IconUpload size={18} /> Upload up to {product.max_photos} photo{product.max_photos > 1 ? 's' : ''}{' '}
                  in the next step
                </li>
              )}
              <li>
                <IconHeart size={18} /> Handcrafted to order — we'll call you to confirm details
              </li>
            </ul>

            {product.description && <div className="pdp-desc">{product.description}</div>}
          </div>
        </div>
      </div>

      <OrderModal open={ordering} onClose={() => setOrdering(false)} product={product} size={selected} />
    </section>
  )
}

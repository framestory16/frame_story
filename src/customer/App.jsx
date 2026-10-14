import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Header, Footer, FloatingInstagram } from './components.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Category from './pages/Category.jsx'
import Product from './pages/Product.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/c/:slug" element={<Category />} />
          <Route path="/p/:id" element={<Product />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <FloatingInstagram />
    </>
  )
}

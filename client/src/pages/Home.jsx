import HeroBanner from '../components/HeroBanner'
import FeaturedProducts from '../components/FeaturedProducts'
import Footer from '../components/Footer'

function Home() {
  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      <HeroBanner />
      <FeaturedProducts />
      <Footer />
    </div>
  )
}

export default Home

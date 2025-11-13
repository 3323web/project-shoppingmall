import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'MAN', label: 'Man' },
  { value: 'WOMAN', label: 'Woman' },
  { value: 'KIDS', label: 'Kids' },
  { value: 'ACCESSORIES', label: 'Accessories' }
]

function FeaturedProducts() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let url = 'http://localhost:5000/api/products?limit=20&isActive=true&productStatus=판매중&sortBy=sortOrder&sortOrder=desc'
      
      if (selectedCategory) {
        url += `&parentCategory=${selectedCategory}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
        console.log('불러온 상품 수:', data.data.length)
        console.log('선택된 카테고리:', selectedCategory || 'All')
      }
    } catch (error) {
      console.error('상품 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ padding: '80px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={titleStyle}>Featured Collection</h2>
        <p style={subtitleStyle}>Hand-selected pieces for the discerning customer</p>
      </div>

      {/* Category Tabs */}
      <div style={tabsContainerStyle}>
        {CATEGORIES.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            style={{
              ...tabStyle,
              backgroundColor: selectedCategory === category.value ? '#1a1a1a' : '#f5f5f5',
              color: selectedCategory === category.value ? 'white' : '#333'
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div style={gridStyle}>
        {loading ? (
          <p style={messageStyle}>로딩 중...</p>
        ) : products.length === 0 ? (
          <p style={messageStyle}>등록된 상품이 없습니다.</p>
        ) : (
          products.map((product) => (
            <ProductCard key={product._id} product={product} navigate={navigate} />
          ))
        )}
      </div>
    </section>
  )
}

function ProductCard({ product, navigate }) {
  const handleClick = () => {
    navigate(`/product/${product._id}`)
  }

  return (
    <div style={{ cursor: 'pointer' }} onClick={handleClick}>
      {product.listImage ? (
        <img 
          src={product.listImage} 
          alt={product.name}
          style={{
            width: '100%',
            aspectRatio: '3/4',
            objectFit: 'cover',
            marginBottom: '15px'
          }}
        />
      ) : (
        <div style={imageBoxStyle}>이미지 없음</div>
      )}
      <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px', letterSpacing: '0.3px' }}>
        {product.sku}
      </div>
      <h3 style={productNameStyle}>{product.name}</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={originalPriceStyle}>
          {product.marketPrice.toLocaleString()}원
        </span>
        <span style={discountPriceStyle}>
          {product.price.toLocaleString()}원
        </span>
      </div>
    </div>
  )
}

const titleStyle = {
  fontSize: '36px',
  fontWeight: '400',
  marginBottom: '15px',
  color: '#1a1a1a'
}

const subtitleStyle = {
  fontSize: '15px',
  color: '#666',
  letterSpacing: '0.3px'
}

const tabsContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '15px',
  marginBottom: '50px'
}

const tabStyle = {
  padding: '10px 30px',
  border: 'none',
  borderRadius: '25px',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  letterSpacing: '0.5px',
  transition: 'all 0.3s'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '30px',
  maxWidth: '1400px',
  margin: '0 auto',
  minHeight: '400px'
}

const messageStyle = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  color: '#666'
}

const imageBoxStyle = {
  backgroundColor: '#f8f8f8',
  aspectRatio: '3/4',
  marginBottom: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#999',
  fontSize: '14px'
}

const productNameStyle = {
  fontSize: '15px',
  fontWeight: '500',
  marginBottom: '8px',
  color: '#1a1a1a'
}

const originalPriceStyle = {
  fontSize: '14px',
  color: '#999',
  textDecoration: 'line-through'
}

const discountPriceStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a'
}

export default FeaturedProducts


import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'

const BANNER_DATA = [
  {
    title: 'Timeless Elegance',
    description: 'Discover our curated collection of contemporary fashion and timeless pieces',
    buttonText: 'EXPLORE COLLECTION',
    link: '/products'
  },
  {
    title: 'New Arrivals',
    description: 'Explore the latest additions to our exclusive collection',
    buttonText: 'SHOP NOW',
    link: '/products?category=new'
  },
  {
    title: 'Exclusive Accessories',
    description: 'Complete your look with our handpicked accessories',
    buttonText: 'VIEW ACCESSORIES',
    link: '/products?category=accessories'
  }
]

function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const currentBanner = useMemo(() => BANNER_DATA[currentSlide], [currentSlide])

  // 자동 슬라이드
  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % BANNER_DATA.length)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isHovering])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % BANNER_DATA.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + BANNER_DATA.length) % BANNER_DATA.length)
  }, [])

  return (
    <section 
      style={sectionStyle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Banner Content */}
      <div style={contentStyle}>
        <h1 style={titleStyle}>
          {currentBanner.title}
        </h1>
        <p style={descriptionStyle}>
          {currentBanner.description}
        </p>
        <Link to={currentBanner.link} style={buttonStyle}>
          {currentBanner.buttonText}
        </Link>
      </div>
      
      {/* Navigation Arrows */}
      <button onClick={prevSlide} style={{...arrowStyle, left: '40px'}}>
        ←
      </button>
      <button onClick={nextSlide} style={{...arrowStyle, right: '40px'}}>
        →
      </button>

      {/* Slide Indicators */}
      <div style={indicatorsContainerStyle}>
        {BANNER_DATA.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              ...indicatorStyle,
              backgroundColor: currentSlide === index ? '#1a1a1a' : '#ccc'
            }}
          />
        ))}
      </div>
    </section>
  )
}

const sectionStyle = {
  backgroundColor: '#f8f8f8',
  padding: '120px 60px',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden'
}

const contentStyle = {
  transition: 'opacity 0.5s ease-in-out',
  opacity: 1
}

const titleStyle = {
  fontSize: '56px',
  fontWeight: '400',
  marginBottom: '20px',
  color: '#1a1a1a',
  letterSpacing: '1px'
}

const descriptionStyle = {
  fontSize: '16px',
  color: '#666',
  marginBottom: '40px',
  letterSpacing: '0.5px'
}

const buttonStyle = {
  display: 'inline-block',
  padding: '16px 48px',
  backgroundColor: '#1a1a1a',
  color: 'white',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
  letterSpacing: '1.5px',
  borderRadius: '2px',
  transition: 'background-color 0.3s'
}

const arrowStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '20px',
  transition: 'all 0.3s'
}

const indicatorsContainerStyle = {
  position: 'absolute',
  bottom: '30px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '10px'
}

const indicatorStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.3s'
}

export default HeroBanner


import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productService } from '../services/productService'
import { cartService } from '../services/cartService'

const CATEGORY_TAGS = {
  '세일상품': { label: '세일상품', color: '#ff4444' },
  '긴팔가능': { label: '긴팔가능', color: '#ff8800' },
  '아동가능': { label: '아동가능', color: '#44aa44' },
  '빅사이즈': { label: '빅사이즈', color: '#9933cc' },
  '여성용': { label: '여성용', color: '#ff66aa' },
  '신상품': { label: '신상품', color: '#33ccff' },
  '추천상품': { label: '추천상품', color: '#0066cc' }
}

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [cartItems, setCartItems] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await productService.getProductById(id)
      if (response.success) {
        setProduct(response.data)
      }
    } catch (error) {
      console.error('상품 조회 실패:', error)
      alert('상품을 불러오는데 실패했습니다.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (optionType, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionType]: value
    }))
  }

  const addToCartItems = () => {
    if (!product) return

    // 옵션 검증
    const requiredOptions = []
    if (product.customOptions && product.customOptions.length > 0) {
      product.customOptions.forEach(opt => {
        requiredOptions.push(opt.optionName)
      })
    }
    if (product.colorOptions && product.colorOptions.length > 0) {
      requiredOptions.push('색상')
    }
    if (product.sizeOptions && product.sizeOptions.length > 0) {
      requiredOptions.push('사이즈')
    }

    for (const option of requiredOptions) {
      if (!selectedOptions[option]) {
        alert(`${option}을(를) 선택해주세요.`)
        return
      }
    }

    // 가격 계산
    let totalPrice = product.price
    
    // 추가 옵션 가격 추가
    if (product.customOptions && product.customOptions.length > 0) {
      product.customOptions.forEach(customOpt => {
        const selectedValue = selectedOptions[customOpt.optionName]
        if (selectedValue) {
          const optionValue = customOpt.optionValues.find(v => v.valueName === selectedValue)
          if (optionValue && optionValue.price > 0) {
            totalPrice += optionValue.price
          }
        }
      })
    }

    // 색상 옵션 가격 추가
    if (product.colorOptions && selectedOptions['색상']) {
      const colorOpt = product.colorOptions.find(c => c.colorName === selectedOptions['색상'])
      if (colorOpt && colorOpt.price > 0) {
        totalPrice += colorOpt.price
      }
    }

    // 사이즈 옵션 가격 추가
    if (product.sizeOptions && selectedOptions['사이즈']) {
      const sizeOpt = product.sizeOptions.find(s => s.sizeName === selectedOptions['사이즈'])
      if (sizeOpt && sizeOpt.price > 0) {
        totalPrice += sizeOpt.price
      }
    }

    // 옵션 문자열 생성
    const optionString = Object.entries(selectedOptions)
      .map(([key, value]) => value)
      .join(' / ')

    // 이미 같은 옵션이 있는지 확인
    const existingItem = cartItems.find(item => item.options === optionString)
    if (existingItem) {
      alert('이미 선택된 옵션입니다.')
      return
    }

    const newItem = {
      id: Date.now(),
      options: optionString,
      quantity: 1,
      price: totalPrice
    }

    setCartItems(prev => [...prev, newItem])
    setSelectedOptions({}) // 옵션 초기화
  }

  const updateQuantity = (itemId, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  const removeCartItem = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
  }

  const getTotalQuantity = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleAddToCart = async () => {
    if (cartItems.length === 0) {
      alert('옵션을 선택해주세요.')
      return
    }

    // 로그인 확인
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    try {
      // 장바구니에 추가할 아이템들 준비
      const itemsToAdd = cartItems.map(item => {
        // 옵션 파싱
        const optionParts = item.options.split(' / ')
        const selectedOptions = {
          customOptions: [],
          color: {},
          size: {}
        }

        // 옵션 문자열에서 각 옵션 추출
        optionParts.forEach(part => {
          // 추가 옵션
          if (product.customOptions && product.customOptions.length > 0) {
            product.customOptions.forEach(customOpt => {
              const optionValue = customOpt.optionValues.find(v => v.valueName === part)
              if (optionValue) {
                selectedOptions.customOptions.push({
                  optionName: customOpt.optionName,
                  valueName: optionValue.valueName,
                  price: optionValue.price
                })
              }
            })
          }

          // 색상 옵션
          if (product.colorOptions && product.colorOptions.length > 0) {
            const colorOpt = product.colorOptions.find(c => c.colorName === part)
            if (colorOpt) {
              selectedOptions.color = {
                colorName: colorOpt.colorName,
                price: colorOpt.price
              }
            }
          }

          // 사이즈 옵션
          if (product.sizeOptions && product.sizeOptions.length > 0) {
            const sizeOpt = product.sizeOptions.find(s => s.sizeName === part)
            if (sizeOpt) {
              selectedOptions.size = {
                sizeName: sizeOpt.sizeName,
                price: sizeOpt.price
              }
            }
          }
        })

        return {
          productId: product._id,
          selectedOptions,
          quantity: item.quantity,
          unitPrice: item.price
        }
      })

      // 장바구니에 일괄 추가
      const response = await cartService.addBulkItemsToCart(itemsToAdd)
      
      if (response.success) {
        // 장바구니 페이지로 이동할지 묻기
        const goToCart = window.confirm('장바구니에 추가되었습니다.\n장바구니 페이지로 이동하시겠습니까?')
        
        if (goToCart) {
          navigate('/cart')
        } else {
          // 선택된 아이템 초기화
          setCartItems([])
          // 네비게이션바 업데이트를 위한 이벤트 발생
          window.dispatchEvent(new Event('cartUpdated'))
        }
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error)
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
        navigate('/login')
      } else {
        alert('장바구니 추가에 실패했습니다.')
      }
    }
  }

  const handleBuyNow = async () => {
    if (cartItems.length === 0) {
      alert('옵션을 선택해주세요.')
      return
    }

    // 로그인 확인
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      alert('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    try {
      // 구매하기용 아이템들 준비 (장바구니에 추가하지 않고 임시 저장)
      const buyNowItems = cartItems.map(item => {
        // 옵션 파싱
        const optionParts = item.options.split(' / ')
        const selectedOptions = {
          customOptions: [],
          color: {},
          size: {}
        }

        // 옵션 문자열에서 각 옵션 추출
        optionParts.forEach(part => {
          // 추가 옵션
          if (product.customOptions && product.customOptions.length > 0) {
            product.customOptions.forEach(customOpt => {
              const optionValue = customOpt.optionValues.find(v => v.valueName === part)
              if (optionValue) {
                selectedOptions.customOptions.push({
                  optionName: customOpt.optionName,
                  valueName: optionValue.valueName,
                  price: optionValue.price
                })
              }
            })
          }

          // 색상 옵션
          if (product.colorOptions && product.colorOptions.length > 0) {
            const colorOpt = product.colorOptions.find(c => c.colorName === part)
            if (colorOpt) {
              selectedOptions.color = {
                colorName: colorOpt.colorName,
                price: colorOpt.price
              }
            }
          }

          // 사이즈 옵션
          if (product.sizeOptions && product.sizeOptions.length > 0) {
            const sizeOpt = product.sizeOptions.find(s => s.sizeName === part)
            if (sizeOpt) {
              selectedOptions.size = {
                sizeName: sizeOpt.sizeName,
                price: sizeOpt.price
              }
            }
          }
        })

        return {
          productId: product._id,
          product: {
            _id: product._id,
            name: product.name,
            listImage: product.listImage,
            sku: product.sku
          },
          selectedOptions,
          quantity: item.quantity,
          unitPrice: item.price
        }
      })

      // 구매하기용 아이템을 sessionStorage에 저장
      sessionStorage.setItem('buyNowItems', JSON.stringify(buyNowItems))
      
      // 선택된 아이템 초기화
      setCartItems([])
      
      // Checkout 페이지로 이동
      navigate('/checkout')
    } catch (error) {
      console.error('구매하기 처리 실패:', error)
      alert('구매하기 처리에 실패했습니다.')
    }
  }

  const toggleWishlist = () => {
    alert('위시리스트 기능은 준비 중입니다.')
    // TODO: 위시리스트 API 연동
  }

  const getDiscountRate = () => {
    if (!product || product.marketPrice === 0) return 0
    return Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)
  }

  if (loading) {
    return (
      <div style={loadingStyle}>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={loadingStyle}>
        <p>상품을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const discountRate = getDiscountRate()

  return (
    <div style={containerStyle}>
      {/* 카테고리 태그 */}
      <div style={tagsContainerStyle}>
        {Object.values(CATEGORY_TAGS).map((tag, index) => (
          <span key={index} style={{ ...tagStyle, backgroundColor: tag.color }}>
            {tag.label}
          </span>
        ))}
      </div>

      {/* 상품 정보 섹션 */}
      <div style={mainSectionStyle}>
        {/* 왼쪽: 상세 이미지 */}
        <div style={imageContainerStyle}>
          {product.detailImages && product.detailImages.length > 0 ? (
            <div>
              <img 
                src={product.detailImages[currentImageIndex]} 
                alt={product.name}
                style={mainImageStyle}
              />
              {product.detailImages.length > 1 && (
                <div style={thumbnailContainerStyle}>
                  {product.detailImages.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      style={{
                        ...thumbnailStyle,
                        border: currentImageIndex === index ? '2px solid #1a1a1a' : '1px solid #ddd'
                      }}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={noImageStyle}>상세이미지</div>
          )}
        </div>

        {/* 오른쪽: 상품 정보 */}
        <div style={infoContainerStyle}>
          {/* 상품 코드 */}
          <div style={skuStyle}>{product.sku}</div>

          {/* 상품명 */}
          <h1 style={productNameStyle}>{product.name}</h1>

          {/* 가격 정보 */}
          <div style={priceContainerStyle}>
            <div style={originalPriceStyle}>
              {product.marketPrice.toLocaleString()}원
            </div>
            {discountRate > 0 && (
              <span style={discountRateStyle}>{discountRate}%</span>
            )}
            <div style={salePriceStyle}>
              {product.price.toLocaleString()}원
            </div>
          </div>

          {/* 제품소재 */}
          {product.material && (
            <div style={infoRowStyle}>
              <span style={labelStyle}>제품소재 : </span>
              <span>{product.material}</span>
            </div>
          )}

          {/* 참고사항 */}
          {product.notes && (
            <div style={infoRowStyle}>
              <span style={labelStyle}>참고사항 : </span>
              <span>{product.notes}</span>
            </div>
          )}

          {/* 옵션 선택 */}
          <div style={optionSectionStyle}>
            {/* 추가 옵션 (1순위) */}
            {product.customOptions && product.customOptions.map((customOpt, index) => (
              <div key={index} style={selectWrapperStyle}>
                <select
                  value={selectedOptions[customOpt.optionName] || ''}
                  onChange={(e) => handleOptionChange(customOpt.optionName, e.target.value)}
                  style={selectStyle}
                >
                  <option value="">{customOpt.optionName}</option>
                  {customOpt.optionValues
                    .sort((a, b) => a.optionOrder - b.optionOrder)
                    .map((value, vIndex) => (
                      <option key={vIndex} value={value.valueName}>
                        {value.valueName}
                        {value.price > 0 && ` (+${value.price.toLocaleString()}원)`}
                      </option>
                    ))}
                </select>
              </div>
            ))}

            {/* 색상 옵션 */}
            {product.colorOptions && product.colorOptions.length > 0 && (
              <div style={selectWrapperStyle}>
                <select
                  value={selectedOptions['색상'] || ''}
                  onChange={(e) => handleOptionChange('색상', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">색상</option>
                  {product.colorOptions
                    .sort((a, b) => a.optionOrder - b.optionOrder)
                    .map((color, index) => (
                      <option key={index} value={color.colorName}>
                        {color.colorName}
                        {color.price > 0 && ` (+${color.price.toLocaleString()}원)`}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* 사이즈 옵션 */}
            {product.sizeOptions && product.sizeOptions.length > 0 && (
              <div style={selectWrapperStyle}>
                <select
                  value={selectedOptions['사이즈'] || ''}
                  onChange={(e) => handleOptionChange('사이즈', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">사이즈</option>
                  {product.sizeOptions
                    .sort((a, b) => a.optionOrder - b.optionOrder)
                    .map((size, index) => (
                      <option key={index} value={size.sizeName}>
                        {size.sizeName}
                        {size.price > 0 && ` (+${size.price.toLocaleString()}원)`}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* 옵션 추가 버튼 */}
            <button onClick={addToCartItems} style={addOptionButtonStyle}>
              옵션 추가
            </button>
          </div>

          {/* 선택된 상품 목록 */}
          {cartItems.length > 0 && (
            <div style={cartItemsContainerStyle}>
              {cartItems.map(item => (
                <div key={item.id} style={cartItemStyle}>
                  <div style={cartItemInfoStyle}>
                    <div style={cartItemNameStyle}>{item.options}</div>
                    <div style={quantityControlStyle}>
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        style={quantityButtonStyle}
                      >
                        −
                      </button>
                      <span style={quantityStyle}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        style={quantityButtonStyle}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div style={cartItemPriceStyle}>
                    {(item.price * item.quantity).toLocaleString()}원
                    <button 
                      onClick={() => removeCartItem(item.id)}
                      style={removeButtonStyle}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 총 금액 */}
          {cartItems.length > 0 && (
            <div style={totalSectionStyle}>
              <div style={totalQuantityStyle}>
                총 수량 {getTotalQuantity()}개
              </div>
              <div style={totalPriceStyle}>
                총 상품금액 | <span style={totalAmountStyle}>{getTotalPrice().toLocaleString()}원</span>
              </div>
            </div>
          )}

          {/* 버튼 영역 */}
          <div style={buttonContainerStyle}>
            <button onClick={toggleWishlist} style={wishlistButtonStyle}>
              <span style={heartIconStyle}>♡</span>
            </button>
            <button onClick={handleAddToCart} style={cartButtonStyle}>
              장바구니
            </button>
            <button onClick={handleBuyNow} style={buyButtonStyle}>
              구매하기
            </button>
          </div>
        </div>
      </div>

      {/* 상세설명 영역 */}
      <div style={descriptionSectionStyle}>
        {product.description ? (
          <div 
            style={descriptionContentStyle}
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : (
          <div style={noDescriptionStyle}>상세설명 영역</div>
        )}
      </div>
    </div>
  )
}

// 스타일 정의
const containerStyle = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '20px 40px',
  backgroundColor: '#ffffff'
}

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  fontSize: '16px',
  color: '#666'
}

const tagsContainerStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '30px',
  flexWrap: 'wrap'
}

const tagStyle = {
  padding: '6px 16px',
  borderRadius: '4px',
  color: 'white',
  fontSize: '13px',
  fontWeight: '500'
}

const mainSectionStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '60px',
  marginBottom: '60px'
}

const imageContainerStyle = {
  width: '100%'
}

const mainImageStyle = {
  width: '100%',
  aspectRatio: '1',
  objectFit: 'cover',
  backgroundColor: '#f5f5f5',
  marginBottom: '15px'
}

const noImageStyle = {
  width: '100%',
  aspectRatio: '1',
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  color: '#999'
}

const thumbnailContainerStyle = {
  display: 'flex',
  gap: '10px',
  marginTop: '10px'
}

const thumbnailStyle = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const infoContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

const skuStyle = {
  fontSize: '12px',
  color: '#999',
  letterSpacing: '0.5px'
}

const productNameStyle = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0',
  lineHeight: '1.3'
}

const priceContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingBottom: '20px',
  borderBottom: '1px solid #eee'
}

const originalPriceStyle = {
  fontSize: '14px',
  color: '#ccc',
  textDecoration: 'line-through'
}

const discountRateStyle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#ff4444'
}

const salePriceStyle = {
  fontSize: '26px',
  fontWeight: '700',
  color: '#1a1a1a'
}

const infoRowStyle = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#333'
}

const labelStyle = {
  fontWeight: '600',
  color: '#1a1a1a'
}

const optionSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  paddingTop: '10px'
}

const selectWrapperStyle = {
  width: '100%'
}

const selectStyle = {
  width: '100%',
  padding: '14px 16px',
  fontSize: '14px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
  outline: 'none'
}

const addOptionButtonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const cartItemsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '20px 0',
  borderTop: '1px solid #eee',
  borderBottom: '1px solid #eee'
}

const cartItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px'
}

const cartItemInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const cartItemNameStyle = {
  fontSize: '14px',
  color: '#333'
}

const quantityControlStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const quantityButtonStyle = {
  width: '28px',
  height: '28px',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const quantityStyle = {
  minWidth: '30px',
  textAlign: 'center',
  fontSize: '14px'
}

const cartItemPriceStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '15px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const removeButtonStyle = {
  width: '24px',
  height: '24px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontSize: '24px',
  color: '#999',
  lineHeight: '1'
}

const totalSectionStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 0'
}

const totalQuantityStyle = {
  fontSize: '14px',
  color: '#666'
}

const totalPriceStyle = {
  fontSize: '14px',
  color: '#333'
}

const totalAmountStyle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#ff4444'
}

const buttonContainerStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '10px'
}

const wishlistButtonStyle = {
  width: '60px',
  height: '54px',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
}

const heartIconStyle = {
  fontSize: '24px',
  color: '#ff4444'
}

const cartButtonStyle = {
  flex: 1,
  padding: '16px',
  backgroundColor: '#4a90e2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const buyButtonStyle = {
  flex: 1,
  padding: '16px',
  backgroundColor: '#2c3e50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const descriptionSectionStyle = {
  marginTop: '40px',
  padding: '40px 0'
}

const descriptionContentStyle = {
  fontSize: '15px',
  lineHeight: '1.8',
  color: '#333',
  whiteSpace: 'pre-wrap'
}

const noDescriptionStyle = {
  width: '100%',
  minHeight: '400px',
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  color: '#999'
}

export default ProductDetail


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartService } from '../services/cartService'

function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCart()
  }, [])

  // 장바구니 페이지 진입 시 네비게이션바 업데이트
  useEffect(() => {
    // 페이지 진입 시 약간의 지연 후 이벤트 발생 (데이터 로딩 후)
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('cartUpdated'))
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      const response = await cartService.getCart()
      if (response.success) {
        setCart(response.data)
      }
    } catch (error) {
      console.error('장바구니 조회 실패:', error)
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
        navigate('/login')
      } else {
        alert('장바구니를 불러오는데 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      const response = await cartService.updateCartItemQuantity(itemId, newQuantity)
      if (response.success) {
        setCart(response.data)
        // 네비게이션바 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new Event('cartUpdated'))
      }
    } catch (error) {
      console.error('수량 변경 실패:', error)
      alert('수량 변경에 실패했습니다.')
    }
  }

  const handleRemoveItem = async (itemId) => {
    if (!confirm('이 상품을 장바구니에서 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await cartService.removeCartItem(itemId)
      if (response.success) {
        setCart(response.data)
        // 네비게이션바 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new Event('cartUpdated'))
        alert('상품이 삭제되었습니다.')
      }
    } catch (error) {
      console.error('상품 삭제 실패:', error)
      alert('상품 삭제에 실패했습니다.')
    }
  }

  const handleClearCart = async () => {
    if (!confirm('장바구니를 전체 비우시겠습니까?')) {
      return
    }

    try {
      const response = await cartService.clearCart()
      if (response.success) {
        setCart(response.data)
        // 네비게이션바 업데이트를 위한 이벤트 발생
        window.dispatchEvent(new Event('cartUpdated'))
        alert('장바구니가 비워졌습니다.')
      }
    } catch (error) {
      console.error('장바구니 비우기 실패:', error)
      alert('장바구니 비우기에 실패했습니다.')
    }
  }

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      alert('장바구니에 상품이 없습니다.')
      return
    }
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div style={loadingStyle}>
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>장바구니</h1>

      {!cart || cart.items.length === 0 ? (
        <div style={emptyCartStyle}>
          <p style={emptyTextStyle}>장바구니가 비어있습니다.</p>
          <button onClick={() => navigate('/')} style={shopButtonStyle}>
            쇼핑 계속하기
          </button>
        </div>
      ) : (
        <div style={contentWrapperStyle}>
          {/* 장바구니 아이템 목록 */}
          <div style={itemsContainerStyle}>
            {cart.items.map((item) => (
              <div key={item._id} style={itemCardStyle}>
                <div 
                  style={itemImageContainerStyle}
                  onClick={() => navigate(`/product/${item.product._id}`)}
                >
                  {item.product.listImage ? (
                    <img 
                      src={item.product.listImage} 
                      alt={item.product.name}
                      style={itemImageStyle}
                    />
                  ) : (
                    <div style={noImageStyle}>이미지 없음</div>
                  )}
                </div>

                <div style={itemInfoStyle}>
                  <div>
                    <div style={itemSkuStyle}>{item.product.sku}</div>
                    <h3 
                      style={itemNameStyle}
                      onClick={() => navigate(`/product/${item.product._id}`)}
                    >
                      {item.product.name}
                    </h3>
                    
                    {/* 선택된 옵션 표시 */}
                    <div style={optionsStyle}>
                      {item.selectedOptions.customOptions?.map((opt, idx) => (
                        <div key={idx} style={optionTextStyle}>
                          {opt.optionName}: {opt.valueName}
                          {opt.price > 0 && ` (+${opt.price.toLocaleString()}원)`}
                        </div>
                      ))}
                      {item.selectedOptions.color?.colorName && (
                        <div style={optionTextStyle}>
                          색상: {item.selectedOptions.color.colorName}
                          {item.selectedOptions.color.price > 0 && 
                            ` (+${item.selectedOptions.color.price.toLocaleString()}원)`}
                        </div>
                      )}
                      {item.selectedOptions.size?.sizeName && (
                        <div style={optionTextStyle}>
                          사이즈: {item.selectedOptions.size.sizeName}
                          {item.selectedOptions.size.price > 0 && 
                            ` (+${item.selectedOptions.size.price.toLocaleString()}원)`}
                        </div>
                      )}
                    </div>

                    <div style={itemPriceStyle}>
                      {item.unitPrice.toLocaleString()}원
                    </div>
                  </div>

                  <div style={itemActionsStyle}>
                    <div style={quantityControlStyle}>
                      <button 
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        style={quantityButtonStyle}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span style={quantityStyle}>{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        style={quantityButtonStyle}
                      >
                        +
                      </button>
                    </div>

                    <div style={itemTotalStyle}>
                      {(item.unitPrice * item.quantity).toLocaleString()}원
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item._id)}
                      style={removeButtonStyle}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 주문 요약 */}
          <div style={summaryContainerStyle}>
            <div style={summaryBoxStyle}>
              <h2 style={summaryTitleStyle}>주문 요약</h2>
              
              <div style={summaryRowStyle}>
                <span>총 수량</span>
                <span>{cart.totalQuantity}개</span>
              </div>

              <div style={summaryRowStyle}>
                <span>상품 금액</span>
                <span>{cart.totalAmount.toLocaleString()}원</span>
              </div>

              <div style={summaryRowStyle}>
                <span>배송비</span>
                <span>무료</span>
              </div>

              <div style={summaryDividerStyle}></div>

              <div style={summaryTotalStyle}>
                <span style={totalLabelStyle}>총 결제금액</span>
                <span style={totalAmountStyle}>
                  {cart.totalAmount.toLocaleString()}원
                </span>
              </div>

              <button onClick={handleCheckout} style={checkoutButtonStyle}>
                주문하기
              </button>

              <button onClick={handleClearCart} style={clearButtonStyle}>
                장바구니 비우기
              </button>

              <button onClick={() => navigate('/')} style={continueButtonStyle}>
                쇼핑 계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 스타일 정의
const containerStyle = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '40px 60px',
  minHeight: '60vh'
}

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  fontSize: '16px',
  color: '#666'
}

const titleStyle = {
  fontSize: '32px',
  fontWeight: '600',
  marginBottom: '40px',
  color: '#1a1a1a'
}

const emptyCartStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  gap: '30px'
}

const emptyTextStyle = {
  fontSize: '18px',
  color: '#666'
}

const shopButtonStyle = {
  padding: '14px 40px',
  backgroundColor: '#1a1a1a',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const contentWrapperStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 400px',
  gap: '40px',
  alignItems: 'start'
}

const itemsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

const itemCardStyle = {
  display: 'flex',
  gap: '20px',
  padding: '20px',
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px'
}

const itemImageContainerStyle = {
  flexShrink: 0,
  cursor: 'pointer'
}

const itemImageStyle = {
  width: '120px',
  height: '120px',
  objectFit: 'cover',
  borderRadius: '4px',
  transition: 'opacity 0.2s'
}

const noImageStyle = {
  width: '120px',
  height: '120px',
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  color: '#999',
  borderRadius: '4px'
}

const itemInfoStyle = {
  flex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  gap: '20px'
}

const itemSkuStyle = {
  fontSize: '12px',
  color: '#999',
  marginBottom: '5px'
}

const itemNameStyle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 10px 0',
  cursor: 'pointer',
  transition: 'color 0.2s'
}

const optionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '12px'
}

const optionTextStyle = {
  fontSize: '13px',
  color: '#666'
}

const itemPriceStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const itemActionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '12px'
}

const quantityControlStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '4px'
}

const quantityButtonStyle = {
  width: '32px',
  height: '32px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontSize: '18px',
  color: '#333'
}

const quantityStyle = {
  minWidth: '40px',
  textAlign: 'center',
  fontSize: '15px',
  fontWeight: '500'
}

const itemTotalStyle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#1a1a1a'
}

const removeButtonStyle = {
  padding: '8px 16px',
  backgroundColor: 'transparent',
  color: '#999',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const summaryContainerStyle = {
  position: 'sticky',
  top: '20px'
}

const summaryBoxStyle = {
  width: '100%',
  padding: '30px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
}

const summaryTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  marginBottom: '20px',
  color: '#1a1a1a'
}

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '15px',
  color: '#666',
  marginBottom: '12px'
}

const summaryDividerStyle = {
  height: '1px',
  backgroundColor: '#ddd',
  margin: '20px 0'
}

const summaryTotalStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px'
}

const totalLabelStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const totalAmountStyle = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#ff4444'
}

const checkoutButtonStyle = {
  width: '100%',
  padding: '16px',
  backgroundColor: '#1a1a1a',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '12px',
  transition: 'all 0.2s'
}

const clearButtonStyle = {
  width: '100%',
  padding: '14px',
  backgroundColor: 'transparent',
  color: '#999',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  marginBottom: '12px',
  transition: 'all 0.2s'
}

const continueButtonStyle = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#f5f5f5',
  color: '#1a1a1a',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

export default Cart


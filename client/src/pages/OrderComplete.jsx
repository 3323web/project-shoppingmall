import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'

function OrderComplete() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchOrder()
    }
  }, [id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await orderService.getOrderById(id)
      if (response.success) {
        setOrder(response.data)
      }
    } catch (error) {
      console.error('주문 조회 실패:', error)
      alert('주문 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={loadingStyle}>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={loadingStyle}>
        <p>주문 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* 성공 메시지 */}
      <div style={successSectionStyle}>
        <div style={successIconStyle}>✓</div>
        <h1 style={successTitleStyle}>주문이 완료되었습니다!</h1>
        <p style={successMessageStyle}>
          주문번호: <strong>{order.orderNumber}</strong>
        </p>
      </div>

      {/* 주문 정보 */}
      <div style={infoSectionStyle}>
        <h2 style={sectionTitleStyle}>주문 정보</h2>
        
        <div style={infoGridStyle}>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>주문번호</span>
            <span style={infoValueStyle}>{order.orderNumber}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>주문일시</span>
            <span style={infoValueStyle}>
              {new Date(order.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>주문상태</span>
            <span style={infoValueStyle}>{order.orderStatus}</span>
          </div>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>결제금액</span>
            <span style={infoValueStyle}>
              {order.pricing.totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 주문 상품 목록 */}
      <div style={itemsSectionStyle}>
        <h2 style={sectionTitleStyle}>주문 상품</h2>
        <div style={itemsListStyle}>
          {order.items.map((item, index) => (
            <div key={index} style={itemRowStyle}>
              <div style={itemImageStyle}>
                {item.productSnapshot?.listImage ? (
                  <img 
                    src={item.productSnapshot.listImage} 
                    alt={item.productSnapshot.name}
                    style={itemImageImgStyle}
                  />
                ) : (
                  <div style={itemNoImageStyle}>이미지 없음</div>
                )}
              </div>
              <div style={itemInfoStyle}>
                <div style={itemNameStyle}>{item.productSnapshot.name}</div>
                <div style={itemOptionsStyle}>
                  {item.selectedOptions.customOptions?.map((opt, idx) => (
                    <span key={idx}>{opt.valueName} &gt; </span>
                  ))}
                  {item.selectedOptions.color?.colorName && (
                    <span>{item.selectedOptions.color.colorName} &gt; </span>
                  )}
                  {item.selectedOptions.size?.sizeName && (
                    <span>{item.selectedOptions.size.sizeName}</span>
                  )}
                </div>
                <div style={itemQuantityStyle}>
                  {item.quantity}개 × {item.unitPrice.toLocaleString()}원
                </div>
              </div>
              <div style={itemTotalStyle}>
                {item.totalPrice.toLocaleString()}원
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 배송 정보 */}
      <div style={deliverySectionStyle}>
        <h2 style={sectionTitleStyle}>배송 정보</h2>
        <div style={deliveryInfoStyle}>
          <div style={deliveryRowStyle}>
            <span style={deliveryLabelStyle}>수령인</span>
            <span>{order.delivery.recipientName}</span>
          </div>
          <div style={deliveryRowStyle}>
            <span style={deliveryLabelStyle}>연락처</span>
            <span>{order.delivery.recipientPhone}</span>
          </div>
          <div style={deliveryRowStyle}>
            <span style={deliveryLabelStyle}>배송지</span>
            <span>
              {order.delivery.postalCode && `[${order.delivery.postalCode}] `}
              {order.delivery.address} {order.delivery.detailAddress}
            </span>
          </div>
          {order.delivery.deliveryRequest && (
            <div style={deliveryRowStyle}>
              <span style={deliveryLabelStyle}>배송 요청사항</span>
              <span>{order.delivery.deliveryRequest}</span>
            </div>
          )}
        </div>
      </div>

      {/* 버튼 영역 */}
      <div style={buttonSectionStyle}>
        <button onClick={() => navigate('/orders')} style={orderListButtonStyle}>
          주문 목록 보기
        </button>
        <button onClick={() => navigate('/')} style={continueShoppingButtonStyle}>
          쇼핑 계속하기
        </button>
      </div>
    </div>
  )
}

// 스타일 정의
const containerStyle = {
  maxWidth: '1000px',
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

const successSectionStyle = {
  textAlign: 'center',
  padding: '60px 20px',
  marginBottom: '40px'
}

const successIconStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: '#27ae60',
  color: 'white',
  fontSize: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
  fontWeight: 'bold'
}

const successTitleStyle = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#1a1a1a',
  marginBottom: '15px'
}

const successMessageStyle = {
  fontSize: '16px',
  color: '#666'
}

const infoSectionStyle = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '30px',
  marginBottom: '30px'
}

const sectionTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  marginBottom: '20px',
  color: '#1a1a1a'
}

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '20px'
}

const infoItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const infoLabelStyle = {
  fontSize: '14px',
  color: '#666'
}

const infoValueStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const itemsSectionStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '30px',
  marginBottom: '30px'
}

const itemsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

const itemRowStyle = {
  display: 'flex',
  gap: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid #f0f0f0'
}

const itemImageStyle = {
  flexShrink: 0
}

const itemImageImgStyle = {
  width: '100px',
  height: '100px',
  objectFit: 'cover',
  borderRadius: '4px'
}

const itemNoImageStyle = {
  width: '100px',
  height: '100px',
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
  flexDirection: 'column',
  gap: '8px'
}

const itemNameStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const itemOptionsStyle = {
  fontSize: '13px',
  color: '#666'
}

const itemQuantityStyle = {
  fontSize: '14px',
  color: '#999'
}

const itemTotalStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1a1a1a',
  alignSelf: 'flex-start'
}

const deliverySectionStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '30px',
  marginBottom: '40px'
}

const deliveryInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
}

const deliveryRowStyle = {
  display: 'flex',
  gap: '20px',
  fontSize: '15px',
  color: '#333'
}

const deliveryLabelStyle = {
  minWidth: '100px',
  fontWeight: '600',
  color: '#666'
}

const buttonSectionStyle = {
  display: 'flex',
  gap: '15px',
  justifyContent: 'center'
}

const orderListButtonStyle = {
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

const continueShoppingButtonStyle = {
  padding: '14px 40px',
  backgroundColor: '#f5f5f5',
  color: '#1a1a1a',
  border: 'none',
  borderRadius: '4px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

export default OrderComplete


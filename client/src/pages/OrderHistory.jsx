import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { orderService } from '../services/orderService'

function OrderHistory() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders') // orders, cancelled, returned
  const [dateFilter, setDateFilter] = useState('12') // 3, 6, 12 months
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [ordersCount, setOrdersCount] = useState(0)
  const [cancelledCount, setCancelledCount] = useState(0)
  const [returnedCount, setReturnedCount] = useState(0)

  // 초기 로드 시 날짜 범위 설정
  useEffect(() => {
    updateDateRange()
  }, [dateFilter])

  // 날짜나 탭이 변경되면 주문 내역 조회
  useEffect(() => {
    if (startDate && endDate) {
      fetchOrders()
      fetchCounts()
    }
  }, [activeTab, dateFilter, startDate, endDate])

  const updateDateRange = () => {
    if (dateFilter === 'custom') {
      // 커스텀 날짜는 사용자가 직접 입력
      return
    }

    const months = parseInt(dateFilter)
    const endDateObj = new Date()
    const startDateObj = new Date()
    startDateObj.setMonth(startDateObj.getMonth() - months)
    
    // 날짜를 YYYY-MM-DD 형식으로 변환
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    setStartDate(formatDate(startDateObj))
    setEndDate(formatDate(endDateObj))
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      const params = {}
      
      // 날짜 필터 적용
      if (startDate && endDate) {
        params.startDate = startDate
        params.endDate = endDate
      }

      // 탭에 따른 필터
      if (activeTab === 'cancelled') {
        params.orderStatus = '주문취소'
      } else if (activeTab === 'returned') {
        params.orderStatus = '반품완료'
      } else {
        // 주문내역 탭: 취소/반품/교환 완료 제외 (서버에서 처리)
        // orderStatus를 전달하지 않으면 서버에서 자동으로 필터링
      }

      const response = await orderService.getUserOrders(params)
      
      if (response.success) {
        setOrders(response.data)
      }
    } catch (error) {
      console.error('주문 내역 조회 실패:', error)
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
        navigate('/login')
      } else {
        alert('주문 내역을 불러오는데 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCounts = async () => {
    try {
      const params = {}
      
      // 날짜 필터 적용
      if (startDate && endDate) {
        params.startDate = startDate
        params.endDate = endDate
      }

      // 각 탭별 개수 조회
      const [ordersRes, cancelledRes, returnedRes] = await Promise.all([
        orderService.getUserOrders({ ...params }), // orderStatus 없으면 서버에서 자동 필터링
        orderService.getUserOrders({ ...params, orderStatus: '주문취소' }),
        orderService.getUserOrders({ ...params, orderStatus: '반품완료' })
      ])

      if (ordersRes.success) {
        setOrdersCount(ordersRes.total || 0)
      }
      if (cancelledRes.success) {
        setCancelledCount(cancelledRes.total || 0)
      }
      if (returnedRes.success) {
        setReturnedCount(returnedRes.total || 0)
      }
    } catch (error) {
      console.error('주문 개수 조회 실패:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  const canCancel = (order) => {
    return ['주문접수', '결제대기', '결제완료', '배송준비중'].includes(order.orderStatus)
  }

  const canReturn = (order) => {
    return order.orderStatus === '배송완료'
  }

  const canExchange = (order) => {
    return order.orderStatus === '배송완료'
  }

  const handleCancel = async (orderId) => {
    if (!confirm('정말 주문을 취소하시겠습니까?')) {
      return
    }

    try {
      const response = await orderService.cancelOrder(orderId, {
        reason: '고객 요청'
      })

      if (response.success) {
        alert('주문이 취소되었습니다.')
        fetchOrders()
      }
    } catch (error) {
      console.error('주문 취소 실패:', error)
      alert(error.response?.data?.message || '주문 취소에 실패했습니다.')
    }
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
      {/* 헤더 */}
      <h1 style={pageTitleStyle}>주문내역</h1>

      {/* 탭 */}
      <div style={tabsStyle}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            ...tabStyle,
            ...(activeTab === 'orders' ? activeTabStyle : {})
          }}
        >
          주문내역 ({ordersCount}건)
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          style={{
            ...tabStyle,
            ...(activeTab === 'cancelled' ? activeTabStyle : {})
          }}
        >
          취소내역 ({cancelledCount}건)
        </button>
        <button
          onClick={() => setActiveTab('returned')}
          style={{
            ...tabStyle,
            ...(activeTab === 'returned' ? activeTabStyle : {})
          }}
        >
          반품/교환내역 ({returnedCount}건)
        </button>
      </div>

      {/* 날짜 필터 */}
      <div style={filterSectionStyle}>
        <div style={dateFilterButtonsStyle}>
          <button
            onClick={() => {
              setDateFilter('3')
            }}
            style={{
              ...dateFilterButtonStyle,
              ...(dateFilter === '3' ? activeDateFilterStyle : {})
            }}
          >
            3개월
          </button>
          <button
            onClick={() => {
              setDateFilter('6')
            }}
            style={{
              ...dateFilterButtonStyle,
              ...(dateFilter === '6' ? activeDateFilterStyle : {})
            }}
          >
            6개월
          </button>
          <button
            onClick={() => {
              setDateFilter('12')
            }}
            style={{
              ...dateFilterButtonStyle,
              ...(dateFilter === '12' ? activeDateFilterStyle : {})
            }}
          >
            12개월
          </button>
        </div>
        <div style={customDateStyle}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setDateFilter('custom')
            }}
            style={dateInputStyle}
          />
          <span style={dateSeparatorStyle}>~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setDateFilter('custom')
            }}
            style={dateInputStyle}
          />
        </div>
      </div>

      {/* 주문 목록 */}
      {orders.length === 0 ? (
        <div style={emptyStateStyle}>
          <p style={emptyTextStyle}>주문 내역이 없습니다.</p>
          <button onClick={() => navigate('/')} style={shopButtonStyle}>
            쇼핑하러 가기
          </button>
        </div>
      ) : (
        <div style={ordersListStyle}>
          {orders.map((order) => (
            <div key={order._id} style={orderCardStyle}>
              {/* 주문 헤더 */}
              <div style={orderHeaderStyle}>
                <div style={orderHeaderLeftStyle}>
                  <div style={orderDateStyle}>{formatDate(order.createdAt)}</div>
                  <div style={orderNumberStyle}>
                    주문번호: #{order.orderNumber}
                  </div>
                </div>
                <div style={orderHeaderRightStyle}>
                  <Link
                    to={`/order-detail/${order._id}`}
                    style={orderDetailLinkStyle}
                  >
                    주문상세 &gt;
                  </Link>
                  <div style={orderTotalStyle}>
                    총 결제액 : {order.pricing.totalAmount.toLocaleString()}원
                  </div>
                </div>
              </div>

              {/* 주문 상품 목록 */}
              <div style={orderItemsContainerStyle}>
                {order.items.map((item, index) => (
                  <div key={index} style={orderItemRowStyle}>
                    <div style={orderItemLeftStyle}>
                      <div style={orderItemImageStyle}>
                        {item.productSnapshot?.listImage ? (
                          <img
                            src={item.productSnapshot.listImage}
                            alt={item.productSnapshot.name}
                            style={orderItemImageImgStyle}
                            onClick={() => {
                              const productId = item.product?._id || item.product
                              if (productId) {
                                navigate(`/product/${productId}`)
                              }
                            }}
                          />
                        ) : (
                          <div style={orderItemNoImageStyle}>이미지 없음</div>
                        )}
                      </div>
                      <div style={orderItemInfoStyle}>
                        <div
                          style={orderItemNameStyle}
                          onClick={() => {
                            const productId = item.product?._id || item.product
                            if (productId) {
                              navigate(`/product/${productId}`)
                            }
                          }}
                        >
                          {item.productSnapshot.name}
                        </div>
                        <div style={orderItemOptionsStyle}>
                          옵션 &gt;{' '}
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
                        <div style={orderItemQuantityPriceStyle}>
                          {item.quantity}개 × {item.unitPrice.toLocaleString()}원
                        </div>
                        <div style={orderItemPriceStyle}>
                          {item.totalPrice.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                    <div style={orderItemRightStyle}>
                      <div style={getStatusBadgeStyle(order.orderStatus)}>
                        {order.orderStatus}
                      </div>
                      <div style={actionButtonsStyle}>
                        {canCancel(order) && (
                          <button
                            onClick={() => handleCancel(order._id)}
                            style={actionButtonStyle}
                          >
                            취소신청
                          </button>
                        )}
                        {canReturn(order) && (
                          <button style={actionButtonStyle}>
                            반품신청
                          </button>
                        )}
                        {canExchange(order) && (
                          <button style={actionButtonStyle}>
                            교환신청
                          </button>
                        )}
                        {order.orderStatus === '배송완료' && (
                          <button style={reviewButtonStyle}>
                            리뷰작성
                          </button>
                        )}
                        <button style={inquiryButtonStyle}>
                          문의하기
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 스타일 정의
const containerStyle = {
  maxWidth: '1200px',
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

const pageTitleStyle = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  marginBottom: '30px'
}

const tabsStyle = {
  display: 'flex',
  gap: '0',
  marginBottom: '30px',
  borderBottom: '2px solid #e0e0e0'
}

const tabStyle = {
  padding: '12px 24px',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  fontSize: '15px',
  fontWeight: '500',
  color: '#999',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const activeTabStyle = {
  backgroundColor: '#1a1a1a',
  color: 'white',
  borderBottom: '2px solid #1a1a1a'
}

const filterSectionStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
  paddingBottom: '20px',
  borderBottom: '1px solid #e0e0e0'
}

const dateFilterButtonsStyle = {
  display: 'flex',
  gap: '10px'
}

const dateFilterButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const activeDateFilterStyle = {
  backgroundColor: '#1a1a1a',
  color: 'white',
  border: '1px solid #1a1a1a'
}

const customDateStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
}

const dateInputStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px'
}

const dateSeparatorStyle = {
  fontSize: '14px',
  color: '#666'
}

const emptyStateStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  gap: '20px'
}

const emptyTextStyle = {
  fontSize: '16px',
  color: '#666'
}

const shopButtonStyle = {
  padding: '12px 30px',
  backgroundColor: '#1a1a1a',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer'
}

const ordersListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

const orderCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '20px'
}

const orderHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid #f0f0f0'
}

const orderHeaderLeftStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const orderDateStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const orderNumberStyle = {
  fontSize: '14px',
  color: '#666'
}

const orderHeaderRightStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '8px'
}

const orderDetailLinkStyle = {
  fontSize: '14px',
  color: '#666',
  textDecoration: 'none',
  cursor: 'pointer'
}

const orderTotalStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const orderItemsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

const orderItemRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  paddingBottom: '20px',
  borderBottom: '1px solid #f5f5f5'
}

const orderItemLeftStyle = {
  display: 'flex',
  gap: '15px',
  flex: 1
}

const orderItemImageStyle = {
  flexShrink: 0
}

const orderItemImageImgStyle = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '4px',
  cursor: 'pointer'
}

const orderItemNoImageStyle = {
  width: '80px',
  height: '80px',
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  color: '#999',
  borderRadius: '4px'
}

const orderItemInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  flex: 1
}

const orderItemNameStyle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1a1a1a',
  cursor: 'pointer',
  transition: 'color 0.2s'
}

const orderItemOptionsStyle = {
  fontSize: '13px',
  color: '#666'
}

const orderItemQuantityPriceStyle = {
  fontSize: '13px',
  color: '#999'
}

const orderItemPriceStyle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginTop: '4px'
}

const orderItemRightStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '12px',
  minWidth: '200px'
}

const getStatusBadgeStyle = (status) => {
  const styles = {
    '주문접수': { backgroundColor: '#f0f0f0', color: '#666' },
    '결제대기': { backgroundColor: '#fff3cd', color: '#856404' },
    '결제완료': { backgroundColor: '#d1ecf1', color: '#0c5460' },
    '배송준비중': { backgroundColor: '#d4edda', color: '#155724' },
    '배송중': { backgroundColor: '#cce5ff', color: '#004085' },
    '배송완료': { backgroundColor: '#d1ecf1', color: '#0c5460' },
    '주문취소': { backgroundColor: '#f8d7da', color: '#721c24' }
  }
  const baseStyle = {
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500'
  }
  return {
    ...baseStyle,
    ...(styles[status] || { backgroundColor: '#f0f0f0', color: '#666' })
  }
}

const actionButtonsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'flex-end'
}

const actionButtonStyle = {
  padding: '6px 12px',
  backgroundColor: 'transparent',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '12px',
  color: '#666',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const reviewButtonStyle = {
  padding: '6px 12px',
  backgroundColor: '#4a90e2',
  border: 'none',
  borderRadius: '4px',
  fontSize: '12px',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontWeight: '500'
}

const inquiryButtonStyle = {
  padding: '6px 12px',
  backgroundColor: 'transparent',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '12px',
  color: '#666',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

export default OrderHistory


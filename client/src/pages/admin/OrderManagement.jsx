import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader'
import { orderService } from '../../services/orderService'

function OrderManagement() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusCounts, setStatusCounts] = useState({
    신규: 0,
    접수중: 0,
    배송준비중: 0,
    배송중: 0,
    취소요청: 0,
    반품요청: 0,
    반품중: 0,
    교환요청: 0,
    교환중: 0
  })
  
  // 필터 상태
  const [dateType, setDateType] = useState('주문일') // 주문일, 발송일
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchStatusCounts()
    fetchOrders()
  }, [dateType, startDate, endDate, page, limit])

  const fetchStatusCounts = async () => {
    try {
      const params = {}
      if (startDate && endDate) {
        params.startDate = startDate
        params.endDate = endDate
      }

      // 각 상태별 개수 조회
      const [newOrders, processing, preparing, shipping, cancelRequest, returnRequest, returning, exchangeRequest, exchanging] = await Promise.all([
        orderService.getAllOrders({ ...params, orderStatus: '주문접수', limit: 1 }),
        orderService.getAllOrders({ ...params, orderStatus: '결제완료', limit: 1 }),
        orderService.getAllOrders({ ...params, orderStatus: '배송준비중', limit: 1 }),
        orderService.getAllOrders({ ...params, orderStatus: '배송중', limit: 1 }),
        orderService.getAllOrders({ ...params, orderStatus: '취소요청', limit: 1 }),
        orderService.getAllOrders({ ...params, orderStatus: '반품요청', limit: 1 }),
        orderService.getAllOrders({ ...params, orderStatus: '반품진행중', limit: 1 }),
        orderService.getAllOrders({ ...params, orderStatus: '교환요청', limit: 1 }),
        orderService.getAllOrders({ ...params, orderStatus: '교환진행중', limit: 1 })
      ])

      setStatusCounts({
        신규: newOrders.total || 0,
        접수중: processing.total || 0,
        배송준비중: preparing.total || 0,
        배송중: shipping.total || 0,
        취소요청: cancelRequest.total || 0,
        반품요청: returnRequest.total || 0,
        반품중: returning.total || 0,
        교환요청: exchangeRequest.total || 0,
        교환중: exchanging.total || 0
      })
    } catch (error) {
      console.error('상태별 개수 조회 실패:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit
      }

      // 날짜 필터 적용
      if (startDate && endDate) {
        if (dateType === '주문일') {
          params.startDate = startDate
          params.endDate = endDate
        } else if (dateType === '발송일') {
          params.shippedStartDate = startDate
          params.shippedEndDate = endDate
        }
      }

      const response = await orderService.getAllOrders(params)
      
      if (response.success) {
        setOrders(response.data)
        setTotal(response.total || 0)
      }
    } catch (error) {
      console.error('주문 목록 조회 실패:', error)
      alert('주문 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = String(date.getFullYear()).slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]
    return `${year}.${month}.${day}(${weekday})`
  }

  const formatDateRange = (start, end) => {
    if (!start || !end) return ''
    const startDate = new Date(start)
    const endDate = new Date(end)
    const format = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}.${month}.${day}`
    }
    return `${format(startDate)} ~ ${format(endDate)}`
  }

  const handleDateFilter = (type) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    switch (type) {
      case 'today':
        setStartDate(formatDate(today))
        setEndDate(formatDate(today))
        break
      case 'yesterday':
        // 어제부터 현재일까지
        setStartDate(formatDate(yesterday))
        setEndDate(formatDate(today))
        break
      case 'lastWeek':
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)
        setStartDate(formatDate(lastWeek))
        setEndDate(formatDate(today))
        break
      case 'lastMonth':
        // 지난달 1일~말일까지
        setStartDate(formatDate(firstDayOfLastMonth))
        setEndDate(formatDate(lastDayOfLastMonth))
        break
      case 'thisMonth':
        // 당월 1일~현재일까지
        setStartDate(formatDate(firstDayOfMonth))
        setEndDate(formatDate(today))
        break
      case 'thisYear':
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
        setStartDate(formatDate(firstDayOfYear))
        setEndDate(formatDate(today))
        break
      default:
        break
    }
  }

  const getOrderContent = (order) => {
    if (!order.items || order.items.length === 0) return ''
    
    const firstItem = order.items[0]
    const productName = firstItem.productSnapshot?.name || '상품명 없음'
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
    
    if (order.items.length > 1) {
      return `${productName} 외 (총 ${totalItems}개)`
    }
    return `${productName} (총 ${totalItems}개)`
  }

  const getPaymentMethod = (order) => {
    return order.payment?.method || '미결제'
  }

  const handleStatusChange = async (orderId, currentStatus, newStatus, selectElement) => {
    if (currentStatus === newStatus) {
      return
    }

    if (!confirm(`주문상태를 "${newStatus}"로 변경하시겠습니까?`)) {
      // 취소 시 원래 값으로 되돌림
      if (selectElement) {
        selectElement.value = currentStatus
      }
      return
    }

    try {
      await orderService.updateOrderStatus(orderId, { orderStatus: newStatus })
      alert('주문상태가 변경되었습니다.')
      fetchOrders()
      fetchStatusCounts()
    } catch (error) {
      console.error('주문 상태 변경 실패:', error)
      alert(error.response?.data?.message || '주문 상태 변경에 실패했습니다.')
      // 에러 발생 시 원래 값으로 되돌림
      if (selectElement) {
        selectElement.value = currentStatus
      }
    }
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AdminHeader />

      <main style={{ padding: '30px 40px' }}>
        {/* 주문 상태별 현황 */}
        <div style={{
          backgroundColor: '#ecf0f1',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <StatusItem label="신규" count={statusCounts.신규} color="#5470c6" />
            <StatusItem label="접수중" count={statusCounts.접수중} color="#5470c6" />
            <StatusItem label="배송준비중" count={statusCounts.배송준비중} color="#5470c6" />
            <StatusItem label="배송중" count={statusCounts.배송중} color="#5470c6" />
            <StatusItem label="취소요청" count={statusCounts.취소요청} color="#ef6666" />
            <StatusItem label="반품요청" count={statusCounts.반품요청} color="#ef6666" />
            <StatusItem label="반품중" count={statusCounts.반품중} color="#ef6666" />
            <StatusItem label="교환요청" count={statusCounts.교환요청} color="#ef6666" />
            <StatusItem label="교환중" count={statusCounts.교환중} color="#ef6666" />
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div style={{
          backgroundColor: '#ecf0f1',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="주문일">주문일</option>
              <option value="발송일">발송일</option>
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleDateFilter('today')} style={dateButtonStyle}>
                오늘
              </button>
              <button onClick={() => handleDateFilter('yesterday')} style={dateButtonStyle}>
                어제
              </button>
              <button onClick={() => handleDateFilter('lastWeek')} style={dateButtonStyle}>
                최근일주일
              </button>
              <button onClick={() => handleDateFilter('lastMonth')} style={dateButtonStyle}>
                지난달
              </button>
              <button onClick={() => handleDateFilter('thisMonth')} style={dateButtonStyle}>
                이번달
              </button>
              <button onClick={() => handleDateFilter('thisYear')} style={dateButtonStyle}>
                올해
              </button>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={dateInputStyle}
              />
              <span>~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={dateInputStyle}
              />
              
              {/* 목록보기 콤보박스 */}
              <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>목록보기</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="5">5</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        {/* 주문 목록 테이블 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              로딩 중...
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                    <th style={tableHeaderStyle}>주문번호</th>
                    <th style={tableHeaderStyle}>주문일</th>
                    <th style={tableHeaderStyle}>주문자명</th>
                    <th style={tableHeaderStyle}>주문상태 (결제수단)</th>
                    <th style={tableHeaderStyle}>주문내용</th>
                    <th style={tableHeaderStyle}>총금액</th>
                    <th style={tableHeaderStyle}>주문처리</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        주문 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={tableCellStyle}>{order.orderNumber}</td>
                        <td style={tableCellStyle}>{formatDate(order.createdAt)}</td>
                        <td style={tableCellStyle}>
                          {order.user?.name || order.user?.email || '-'}
                        </td>
                        <td style={tableCellStyle}>
                          {order.orderStatus} ({getPaymentMethod(order)})
                        </td>
                        <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                          {getOrderContent(order)}
                        </td>
                        <td style={tableCellStyle}>
                          {order.pricing?.totalAmount?.toLocaleString() || 0}원
                        </td>
                        <td style={tableCellStyle}>
                          <select
                            value={order.orderStatus}
                            onChange={(e) => {
                              const newStatus = e.target.value
                              handleStatusChange(order._id, order.orderStatus, newStatus, e.target)
                            }}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '13px',
                              cursor: 'pointer',
                              minWidth: '120px'
                            }}
                          >
                            <option value="주문접수">주문접수</option>
                            <option value="결제대기">결제대기</option>
                            <option value="결제완료">결제완료</option>
                            <option value="배송준비중">배송준비중</option>
                            <option value="배송중">배송중</option>
                            <option value="배송완료">배송완료</option>
                            <option value="주문취소">주문취소</option>
                            <option value="부분취소">부분취소</option>
                            <option value="취소요청">취소요청</option>
                            <option value="반품요청">반품요청</option>
                            <option value="반품진행중">반품진행중</option>
                            <option value="반품완료">반품완료</option>
                            <option value="교환요청">교환요청</option>
                            <option value="교환진행중">교환진행중</option>
                            <option value="교환완료">교환완료</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              {Math.ceil(total / limit) > 1 && (
                <div style={{
                  padding: '20px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: page === 1 ? '#f0f0f0' : 'white',
                        color: page === 1 ? '#ccc' : '#333',
                        border: '1px solid #dcdde1',
                        borderRadius: '4px',
                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      이전
                    </button>

                    {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: page === pageNum ? '#3498db' : 'white',
                          color: page === pageNum ? 'white' : '#333',
                          border: '1px solid #dcdde1',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: page === pageNum ? '600' : '400'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                      disabled={page >= Math.ceil(total / limit)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: page >= Math.ceil(total / limit) ? '#f0f0f0' : 'white',
                        color: page >= Math.ceil(total / limit) ? '#ccc' : '#333',
                        border: '1px solid #dcdde1',
                        borderRadius: '4px',
                        cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}

              {/* 총 주문 수 표시 */}
              {!loading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  color: '#7f8c8d',
                  fontSize: '14px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  총 {total}개의 주문
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function StatusItem({ label, count, color }) {
  const displayCount = count === 0 ? '-' : (count < 10 ? String(count) : String(count).padStart(2, '0'))
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '80px'
    }}>
      <span style={{ fontSize: '14px', color: '#555', marginBottom: '5px' }}>{label}</span>
      <span style={{ fontSize: '18px', fontWeight: '700', color: color || '#1a1a1a' }}>
        {displayCount} {count === 0 ? '' : '건'}
      </span>
    </div>
  )
}

// 스타일 정의
const dateButtonStyle = {
  padding: '8px 16px',
  backgroundColor: 'white',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const dateInputStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px'
}

const tableHeaderStyle = {
  padding: '15px',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const tableCellStyle = {
  padding: '15px',
  textAlign: 'center',
  fontSize: '14px',
  color: '#333'
}

const paginationButtonStyle = {
  padding: '6px 12px',
  backgroundColor: 'white',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  color: '#333'
}

export default OrderManagement


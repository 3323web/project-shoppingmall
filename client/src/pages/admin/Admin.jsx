import { useState, useEffect } from 'react'
import AdminHeader from '../../components/AdminHeader'
import { orderService } from '../../services/orderService'
import api from '../../utils/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function Admin() {
  const [productStats, setProductStats] = useState({
    total: 0,
    selling: 0,
    outOfStock: 0,
    ended: 0
  })
  const [orderStats, setOrderStats] = useState({
    주문접수: 0,
    결제완료: 0,
    배송준비중: 0,
    배송중: 0,
    배송완료: 0,
    취소요청: 0,
    반품요청: 0,
    교환요청: 0,
    반품진행중: 0,
    교환진행중: 0
  })
  const [categoryStats, setCategoryStats] = useState([])
  const [categoryPeriod, setCategoryPeriod] = useState('1year') // '1year' 또는 'all'
  const [monthlyStats, setMonthlyStats] = useState({
    totalOrders: 0,
    cancelledOrders: 0,
    confirmationRate: 0,
    totalRevenue: 0
  })
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    monthlyNewUsers: 0,
    averageMonthlyUsers: 0,
    deletedUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProductStats()
    fetchOrderStats()
    fetchCategoryRevenueStats()
    fetchMonthlyOrderStats()
    fetchUserStats()
  }, [])

  useEffect(() => {
    fetchCategoryRevenueStats()
  }, [categoryPeriod])

  const fetchProductStats = async () => {
    try {
      const response = await fetch(`${API_URL}/products/stats/counts`)
      const data = await response.json()
      
      if (data.success) {
        setProductStats(data.data)
      }
    } catch (error) {
      console.error('상품 통계 조회 실패:', error)
    }
  }

  const fetchOrderStats = async () => {
    try {
      const response = await orderService.getOrderStats()
      
      if (response.success && response.data.statusCounts) {
        setOrderStats(response.data.statusCounts)
      }
    } catch (error) {
      console.error('주문 통계 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryRevenueStats = async () => {
    try {
      const response = await orderService.getCategoryRevenueStats(categoryPeriod)
      
      if (response.success && response.data.categoryStats) {
        setCategoryStats(response.data.categoryStats)
      }
    } catch (error) {
      console.error('카테고리별 매출 통계 조회 실패:', error)
    }
  }

  const fetchMonthlyOrderStats = async () => {
    try {
      const response = await orderService.getMonthlyOrderStats()
      
      if (response.success && response.data) {
        setMonthlyStats(response.data)
      }
    } catch (error) {
      console.error('이번달 거래 현황 조회 실패:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/users/stats')
      
      if (response.data.success && response.data.data) {
        setUserStats(response.data.data)
      } else {
        console.error('회원 통계 조회 실패:', response.data.message || '알 수 없는 오류')
      }
    } catch (error) {
      console.error('회원 통계 조회 실패:', error)
      if (error.response) {
        console.error('응답 데이터:', error.response.data)
      }
    }
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AdminHeader />

      {/* Dashboard Content */}
      <main style={{ padding: '30px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
          {/* 이번달 거래 현황 */}
          <DashboardCard title="이번달 거래 현황">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                로딩 중...
              </div>
            ) : (
              <>
                <StatItem label="주문건수" value={monthlyStats.totalOrders.toLocaleString()} unit="건" />
                <StatItem label="취소건수" value={monthlyStats.cancelledOrders.toLocaleString()} unit="건" />
                <StatItem label="주문확정율" value={monthlyStats.confirmationRate} unit="%" />
                <StatItem label="총 매출액" value={monthlyStats.totalRevenue.toLocaleString()} unit="원" />
              </>
            )}
          </DashboardCard>

          {/* 매출 카테고리 통계 */}
          <DashboardCard 
            title="매출 카테고리 통계"
            headerActions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCategoryPeriod('1year')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: categoryPeriod === '1year' ? '#3498db' : 'white',
                    color: categoryPeriod === '1year' ? 'white' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  최근1년
                </button>
                <button
                  onClick={() => setCategoryPeriod('all')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: categoryPeriod === 'all' ? '#3498db' : 'white',
                    color: categoryPeriod === 'all' ? 'white' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  전체
                </button>
              </div>
            }
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                로딩 중...
              </div>
            ) : categoryStats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                데이터가 없습니다.
              </div>
            ) : (
              categoryStats.map((stat, index) => {
                const colors = ['#e74c3c', '#f39c12', '#27ae60', '#3498db']
                return (
                  <CategoryBar 
                    key={stat.category}
                    label={stat.category}
                    percentage={stat.percentage}
                    color={colors[index % colors.length]}
                    revenue={stat.revenue}
                    orderCount={stat.orderCount}
                  />
                )
              })
            )}
          </DashboardCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
          {/* 주문 현황 */}
          <DashboardCard title="주문 현황">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                로딩 중...
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '15px' }}>
                <StatusBox 
                  label="신규주문" 
                  count={String(orderStats.주문접수 || 0).padStart(2, '0')} 
                  color="#3498db" 
                />
                <StatusBox 
                  label="접수중" 
                  count={String(orderStats.결제완료 || 0).padStart(2, '0')} 
                  color="#3498db" 
                />
                <StatusBox 
                  label="배송준비중" 
                  count={String(orderStats.배송준비중 || 0).padStart(2, '0')} 
                  color="#3498db" 
                />
                <StatusBox 
                  label="배송중" 
                  count={String(orderStats.배송중 || 0).padStart(2, '0')} 
                  color="#3498db" 
                />
                <StatusBox 
                  label="배송완료" 
                  count={String(orderStats.배송완료 || 0).padStart(2, '0')} 
                  color="#3498db" 
                />
              </div>
            )}
          </DashboardCard>

          {/* 클레임 현황 */}
          <DashboardCard title="클레임 현황">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                로딩 중...
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '15px' }}>
                <StatusBox 
                  label="취소요청" 
                  count={String(orderStats.취소요청 || 0).padStart(2, '0')} 
                  color="#e74c3c" 
                />
                <StatusBox 
                  label="반품요청" 
                  count={String(orderStats.반품요청 || 0).padStart(2, '0')} 
                  color="#e74c3c" 
                />
                <StatusBox 
                  label="교환요청" 
                  count={String(orderStats.교환요청 || 0).padStart(2, '0')} 
                  color="#e74c3c" 
                />
                <StatusBox 
                  label="반품/교환중" 
                  count={String((orderStats.반품진행중 || 0) + (orderStats.교환진행중 || 0)).padStart(2, '0')} 
                  color="#e74c3c" 
                />
              </div>
            )}
          </DashboardCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* 상품 관리 */}
          <DashboardCard title="상품 관리">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                로딩 중...
              </div>
            ) : (
              <>
                <StatItem label="전체" value={productStats.total.toLocaleString()} unit="건" />
                <StatItem label="판매중" value={productStats.selling.toLocaleString()} unit="건" />
                <StatItem label="일시품절" value={productStats.outOfStock.toLocaleString()} unit="건" />
                <StatItem label="단종/판매종료" value={productStats.ended.toLocaleString()} unit="건" />
              </>
            )}
          </DashboardCard>

          {/* 게시판 관리 */}
          <DashboardCard title="게시판 관리">
            <StatItem label="상품 Q&A" value="4" unit="건" />
            <StatItem label="새로 작성된 리뷰" value="3" unit="건" />
            <StatItem label="평점 낮은 리뷰" value="12" unit="건" />
          </DashboardCard>

          {/* 회원 관리 */}
          <DashboardCard title="회원 관리">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                로딩 중...
              </div>
            ) : (
              <>
                <StatItem label="전체" value={userStats.totalUsers.toLocaleString()} unit="명" />
                <StatItem label="당월 신규회원" value={userStats.monthlyNewUsers.toLocaleString()} unit="명" />
                <StatItem label="월평균 신규회원" value={userStats.averageMonthlyUsers.toLocaleString()} unit="명" />
                <StatItem label="누적 탈퇴회원" value={userStats.deletedUsers.toLocaleString()} unit="명" />
              </>
            )}
          </DashboardCard>
        </div>
      </main>
    </div>
  )
}

// Dashboard Card Component
function DashboardCard({ title, children, headerActions }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
          {title}
        </h3>
        {headerActions && headerActions}
      </div>
      {children}
    </div>
  )
}

// Stat Item Component
function StatItem({ label, value, unit }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
      <span style={{ fontSize: '14px', color: '#555' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: '600' }}>
        <span style={{ color: '#e74c3c', fontSize: '16px' }}>{value}</span>
        <span style={{ color: '#999', marginLeft: '4px' }}>{unit}</span>
      </span>
    </div>
  )
}

// Category Bar Component
function CategoryBar({ label, percentage, color, revenue = 0, orderCount = 0 }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', color: '#555' }}>
          {label}
          <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
            ({revenue.toLocaleString()}원 / {orderCount.toLocaleString()}건)
          </span>
        </span>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>{percentage}%</span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

// Status Box Component
function StatusBox({ label, count, color }) {
  return (
    <div style={{
      flex: 1,
      backgroundColor: color,
      color: 'white',
      padding: '20px 15px',
      borderRadius: '6px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>{count}</div>
      <div style={{ fontSize: '12px', fontWeight: '500' }}>{label}</div>
    </div>
  )
}

export default Admin


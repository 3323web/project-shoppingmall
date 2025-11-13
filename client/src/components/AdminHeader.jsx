import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function AdminHeader() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)

  useEffect(() => {
    // 로그인 유저 정보 가져오기
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    console.log('AdminHeader: 토큰 확인:', token ? '있음' : '없음')
    
    if (token) {
      fetchUserInfo(token)
    } else {
      // 토큰이 없으면 로그인 페이지로
      console.log('AdminHeader: 토큰 없음 - 로그인 페이지로 이동')
      alert('로그인이 필요합니다.')
      navigate('/login')
    }
  }, [navigate])

  const fetchUserInfo = async (token) => {
    try {
      console.log('AdminHeader: 유저 정보 조회 시작')
      const response = await fetch('http://localhost:5000/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      console.log('AdminHeader: 유저 정보 응답:', data)

      if (data.success) {
        setUser(data.data)
        console.log('AdminHeader: 유저 타입:', data.data.user_type)
        
        // 관리자가 아니면 메인 페이지로 리다이렉트
        if (data.data.user_type !== 'admin') {
          console.log('AdminHeader: 관리자 권한 없음')
          alert('관리자 권한이 필요합니다.')
          navigate('/')
        } else {
          console.log('AdminHeader: 관리자 인증 성공')
        }
      } else {
        console.log('AdminHeader: 인증 실패 - data.success:', data.success)
        alert('로그인이 필요합니다.')
        navigate('/login')
      }
    } catch (error) {
      console.error('AdminHeader: 유저 정보 가져오기 실패:', error)
      alert('로그인이 필요합니다.')
      navigate('/login')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 다른 컴포넌트에 로그아웃 알림
    window.dispatchEvent(new Event('authChange'))
    
    alert('로그아웃되었습니다.')
    navigate('/')
  }

  const tabs = ['주문관리', '상품관리', '고객관리', '마케팅관리', '게시판관리', '수익관리']
  
  const subMenus = {
    '주문관리': [
      { name: '주문관리', path: '/admin/order-management' },
      { name: '발주관리', path: '/admin/order-management' },
      { name: '포장관리', path: '/admin/packing' },
      { name: '배송관리', path: '/admin/delivery' }
    ],
    '상품관리': [
      { name: '상품관리', path: '/admin/product-management' },
      { name: '상품등록', path: '/admin/product-register' },
      { name: '카테고리관리', path: '/admin/categories' },
      { name: '템플릿관리', path: '/admin/templates' }
    ],
    '고객관리': [
      { name: '거래처관리', path: '/admin/clients' }
    ],
    '마케팅관리': [
      { name: '이벤트관리', path: '/admin/events' },
      { name: '쿠폰관리', path: '/admin/coupons' },
      { name: '적립금관리', path: '/admin/points' }
    ],
    '게시판관리': [
      { name: '상품문의', path: '/admin/qna' },
      { name: '리뷰관리', path: '/admin/reviews' },
      { name: '공지사항', path: '/admin/notices' }
    ]
  }

  const handleMenuClick = (path) => {
    if (path) {
      navigate(path)
    }
  }

  return (
    <>
      {/* Header */}
      <header style={{
        backgroundColor: '#2c3e50',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 
          style={{ 
            color: 'white', 
            fontSize: '24px', 
            fontWeight: '700', 
            letterSpacing: '1px', 
            margin: 0,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/admin')}
        >
          ADMIN DASHBOARD
        </h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link 
            to="/" 
            style={{ color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
          >
            USER PAGE
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 20px',
              backgroundColor: 'white',
              color: '#1a1a1a',
              border: '1px solid #1a1a1a',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: '#ecf0f1',
        padding: '15px 40px',
        display: 'flex',
        gap: '30px',
        position: 'relative'
      }}>
        {tabs.map(tab => {
          const hasDropdown = subMenus[tab] && subMenus[tab].length > 0
          const isDropdownOpen = activeDropdown === tab
          
          return (
            <div
              key={tab}
              style={{ position: 'relative' }}
              onMouseEnter={() => hasDropdown && setActiveDropdown(tab)}
              onMouseLeave={() => hasDropdown && setActiveDropdown(null)}
            >
              <button
                onClick={() => {
                  setActiveTab(tab)
                  // 주문관리 또는 상품관리 탭 클릭 시 첫번째 하위메뉴 페이지로 이동
                  if ((tab === '주문관리' || tab === '상품관리') && subMenus[tab] && subMenus[tab].length > 0) {
                    handleMenuClick(subMenus[tab][0].path)
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === tab || isDropdownOpen ? '#1a1a1a' : '#7f8c8d',
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? '600' : '500',
                  cursor: 'pointer',
                  padding: '5px 0',
                  borderBottom: activeTab === tab ? '2px solid #1a1a1a' : 'none'
                }}
              >
                {tab}
              </button>

              {/* 드롭다운 메뉴 */}
              {hasDropdown && isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  paddingTop: '15px',
                  zIndex: 1000
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '6px',
                    minWidth: '180px',
                    overflow: 'hidden'
                  }}>
                    {subMenus[tab].map((subMenu, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setActiveTab(subMenu.name)
                          setActiveDropdown(null)
                          handleMenuClick(subMenu.path)
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 20px',
                          border: 'none',
                          backgroundColor: 'white',
                          color: '#333',
                          fontSize: '14px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          borderBottom: index < subMenus[tab].length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f8f8'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {subMenu.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </>
  )
}

export default AdminHeader


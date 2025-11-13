import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [subCategories, setSubCategories] = useState({
    MAN: [],
    WOMAN: [],
    KIDS: [],
    ACCESSORIES: []
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          setUser(null);
          setCartItemCount(0);
          return;
        }

        const response = await fetch(`${API_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setUser(data.data);
          // 장바구니 아이템 수 조회
          fetchCartItemCount();
        } else {
          setUser(null);
          setCartItemCount(0);
        }
      } catch (error) {
        console.error('유저 정보 가져오기 실패:', error);
        // 토큰이 있는데 네트워크 에러라면 재시도 (최대 2번)
        if (token && retryCount < 2) {
          console.log('재시도 중...', retryCount + 1);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchUserInfo();
          }, 1000);
        } else {
          setUser(null);
          setCartItemCount(0);
        }
      }
    };

    const fetchCartItemCount = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setCartItemCount(0);
          return;
        }

        const response = await cartService.getCart();
        
        if (response.success && response.data) {
          const count = response.data.totalQuantity || 0;
          setCartItemCount(count);
        } else {
          setCartItemCount(0);
        }
      } catch (error) {
        console.error('장바구니 조회 실패:', error);
        setCartItemCount(0);
      }
    };

    fetchUserInfo();

    // 로그인/로그아웃 이벤트 감지를 위한 커스텀 이벤트 리스너
    const handleAuthChange = () => {
      fetchUserInfo();
    };

    // 장바구니 업데이트 이벤트 리스너
    const handleCartUpdate = () => {
      fetchCartItemCount();
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // 2차 카테고리 데이터 가져오기
  useEffect(() => {
    const fetchSubCategories = async () => {
      const parentCategories = ['MAN', 'WOMAN', 'KIDS', 'ACCESSORIES'];
      const categoriesData = {};

      try {
        const promises = parentCategories.map(async (parentCategory) => {
          try {
            const response = await fetch(
              `${API_URL}/categories?parentCategory=${parentCategory}&isActive=true`
            );
            const data = await response.json();
            if (data.success) {
              return { parentCategory, categories: data.data };
            }
            return { parentCategory, categories: [] };
          } catch (error) {
            console.error(`${parentCategory} 카테고리 조회 실패:`, error);
            return { parentCategory, categories: [] };
          }
        });

        const results = await Promise.all(promises);
        results.forEach(({ parentCategory, categories }) => {
          categoriesData[parentCategory] = categories;
        });

        setSubCategories(categoriesData);
      } catch (error) {
        console.error('카테고리 조회 실패:', error);
      }
    };

    fetchSubCategories();
  }, []);

  const handleLogout = () => {
    // 토큰 및 사용자 정보 삭제
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 상태 초기화
    setUser(null);
    
    // 다른 컴포넌트에 로그아웃 알림
    window.dispatchEvent(new Event('authChange'));
    
    alert('로그아웃되었습니다.');
    navigate('/');
  };

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
    // 모달이 열린 후 입력 필드에 포커스
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchModalOpen(false);
      setSearchQuery('');
    }
  };

  const handleModalClose = () => {
    setIsSearchModalOpen(false);
    setSearchQuery('');
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isSearchModalOpen) {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSearchModalOpen]);

  return (
    <nav style={{
      backgroundColor: 'white',
      padding: '20px 60px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Left - Logo */}
      <Link to="/" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '28px', fontWeight: '700', letterSpacing: '2px' }}>
        LUXE
      </Link>
      
      {/* Center - Product Categories */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'center', position: 'relative' }}>
        {['MAN', 'WOMAN', 'KIDS', 'ACCESSORIES'].map((parentCategory) => (
          <div
            key={parentCategory}
            style={{ 
              position: 'relative'
            }}
            onMouseEnter={() => setHoveredCategory(parentCategory)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <Link
              to={`/products?parentCategory=${parentCategory}`}
              style={{
                color: '#333',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'block',
                padding: '5px 0',
                position: 'relative',
                zIndex: 1
              }}
            >
              {parentCategory}
            </Link>
            
            {/* 드롭다운 메뉴 */}
            {hoveredCategory === parentCategory && subCategories[parentCategory] && subCategories[parentCategory].length > 0 && (
              <>
                {/* 보이지 않는 연결 영역 - 마우스가 드롭다운으로 이동할 때 메뉴가 사라지지 않도록 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '200px',
                    height: '10px',
                    zIndex: 999
                  }}
                  onMouseEnter={() => setHoveredCategory(parentCategory)}
                />
                {/* 드롭다운 메뉴 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '180px',
                    zIndex: 1000,
                    padding: '10px 0'
                  }}
                  onMouseEnter={() => setHoveredCategory(parentCategory)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                {subCategories[parentCategory].map((category) => (
                  <Link
                    key={category._id}
                    to={`/products?category=${category._id}`}
                    style={{
                      display: 'block',
                      padding: '10px 20px',
                      color: '#333',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '400',
                      transition: 'background-color 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {category.name}
                  </Link>
                ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Right - Icons and Buttons */}
      <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
        {/* Search Icon */}
        <button 
          onClick={handleSearchClick}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '20px',
            padding: '5px',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          🔍
        </button>

        {/* 마이페이지 버튼 - 로그인한 사용자에게만 표시 */}
        {user && (
          <Link 
            to="/orders"
            style={{ 
              color: '#333', 
              textDecoration: 'none', 
              fontSize: '14px', 
              fontWeight: '500', 
              letterSpacing: '0.5px' 
            }}
          >
            마이페이지
          </Link>
        )}

        {/* 로그인 상태에 따라 다른 버튼 표시 */}
        {user ? (
          <button
            onClick={handleLogout}
            style={{ 
              color: '#333', 
              fontSize: '14px',
              fontWeight: '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            LOG OUT
          </button>
        ) : (
          <>
            <Link to="/login" style={{ color: '#333', textDecoration: 'none', fontSize: '14px', fontWeight: '500', letterSpacing: '0.5px' }}>
              LOG IN
            </Link>
            <Link 
              to="/signup" 
              style={{ 
                padding: '10px 20px',
                backgroundColor: '#f5f5f5',
                color: '#1a1a1a',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}
            >
              SIGN UP
            </Link>
          </>
        )}

        {/* Shopping Cart Icon */}
        <Link to="/cart" style={{ position: 'relative', fontSize: '22px', textDecoration: 'none' }}>
          🛒
          {cartItemCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-8px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {cartItemCount}
            </span>
          )}
        </Link>

        {/* Admin Button - 관리자일 경우에만 표시 */}
        {user && user.user_type === 'admin' && (
          <Link 
            to="/admin"
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}
          >
            관리자
          </Link>
        )}
      </div>

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div 
          style={modalOverlayStyle}
          onClick={handleModalClose}
        >
          <div 
            style={modalContentStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
              <div style={searchInputContainerStyle}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상품명, 브랜드, 상품코드로 검색..."
                  style={searchInputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1a1a1a';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleModalClose();
                    }
                  }}
                />
                <button
                  type="submit"
                  style={{
                    ...searchButtonStyle,
                    opacity: searchQuery.trim() ? 1 : 0.5,
                    cursor: searchQuery.trim() ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!searchQuery.trim()}
                  onMouseEnter={(e) => {
                    if (searchQuery.trim()) {
                      e.target.style.backgroundColor = '#333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (searchQuery.trim()) {
                      e.target.style.backgroundColor = '#1a1a1a';
                    }
                  }}
                >
                  검색
                </button>
                <button
                  type="button"
                  onClick={handleModalClose}
                  style={closeButtonStyle}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                  }}
                >
                  ✕
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '100px',
  zIndex: 10000
};

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '30px',
  width: '90%',
  maxWidth: '600px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
};

const searchInputContainerStyle = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  position: 'relative'
};

const searchInputStyle = {
  flex: 1,
  padding: '15px 20px',
  fontSize: '16px',
  border: '2px solid #e0e0e0',
  borderRadius: '4px',
  outline: 'none',
  transition: 'border-color 0.2s'
};

const searchButtonStyle = {
  padding: '15px 30px',
  fontSize: '16px',
  fontWeight: '500',
  backgroundColor: '#1a1a1a',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background-color 0.2s, opacity 0.2s',
  letterSpacing: '0.5px'
};

const closeButtonStyle = {
  position: 'absolute',
  top: '-10px',
  right: '-10px',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#f5f5f5',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#666',
  transition: 'background-color 0.2s'
};

export default Navbar;



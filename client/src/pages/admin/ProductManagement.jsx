import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function ProductManagement() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  
  // 판매상태별 통계
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    selling: 0,
    outOfStock: 0,
    ended: 0
  })
  
  // 검색 및 필터 상태
  const [selectedProductStatus, setSelectedProductStatus] = useState('')
  const [selectedParentCategory, setSelectedParentCategory] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  
  // 정렬 상태
  const [sortBy, setSortBy] = useState('sortOrder')
  const [sortOrder, setSortOrder] = useState('desc')
  const [limitPerPage, setLimitPerPage] = useState(5)
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    // 페이지 진입 시 스크롤을 맨 위로
    window.scrollTo(0, 0)
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [currentPage, selectedParentCategory, selectedCategory, selectedProductStatus, sortBy, sortOrder, limitPerPage])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories?isActive=true`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('카테고리 목록 가져오기 실패:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let url = `${API_URL}/products?page=${currentPage}&limit=${limitPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      
      if (selectedCategory) {
        url += `&category=${selectedCategory}`
      }
      if (selectedParentCategory) {
        url += `&parentCategory=${selectedParentCategory}`
      }
      if (selectedProductStatus) {
        url += `&productStatus=${selectedProductStatus}`
      }
      if (searchKeyword) {
        url += `&search=${encodeURIComponent(searchKeyword)}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts)
        }
      }
    } catch (error) {
      console.error('상품 목록 가져오기 실패:', error)
      alert('상품 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchProducts()
  }

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`"${productName}" 상품을 정말 삭제하시겠습니까?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        alert('상품이 삭제되었습니다.')
        fetchProducts()
      } else {
        alert(data.message || '상품 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('상품 삭제 실패:', error)
      alert('상품 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (productId) => {
    navigate(`/admin/product-edit/${productId}`)
  }

  const filteredCategories = selectedParentCategory
    ? categories.filter(c => c.parentCategory === selectedParentCategory)
    : []

  // 가격 포맷팅
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AdminHeader />
      
      <main style={{ padding: '40px' }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* 페이지 헤더 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              margin: 0,
              color: '#2c3e50'
            }}>
              상품관리
            </h1>
            <button
              onClick={() => navigate('/admin/product-register')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              상품등록
            </button>
          </div>

          {/* 판매상태별 등록현황 및 정렬 기능 */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px 30px',
            borderRadius: '6px',
            marginBottom: '70px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* 판매상태별 통계 */}
            <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#555' }}>
                전체 <span style={{ color: '#e74c3c', fontWeight: '600', fontSize: '16px' }}>{statusCounts.total}</span> 건
              </div>
              <div style={{ fontSize: '14px', color: '#555' }}>
                판매중 <span style={{ color: '#e74c3c', fontWeight: '600', fontSize: '16px' }}>{statusCounts.selling}</span> 건
              </div>
              <div style={{ fontSize: '14px', color: '#555' }}>
                일시품절 <span style={{ color: '#e74c3c', fontWeight: '600', fontSize: '16px' }}>{statusCounts.outOfStock}</span> 건
              </div>
              <div style={{ fontSize: '14px', color: '#555' }}>
                판매종료 <span style={{ color: '#e74c3c', fontWeight: '600', fontSize: '16px' }}>{statusCounts.ended}</span> 건
              </div>
            </div>

            {/* 상품정렬 기능 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setCurrentPage(1)
                }}
                style={selectStyle}
              >
                <option value="sortOrder">정렬순서순</option>
                <option value="price">할인가격순</option>
                <option value="sku">상품코드순</option>
                <option value="name">상품명순</option>
                <option value="adminName">관리자용상품명순</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value)
                  setCurrentPage(1)
                }}
                style={selectStyle}
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>

              <select
                value={limitPerPage}
                onChange={(e) => {
                  setLimitPerPage(parseInt(e.target.value))
                  setCurrentPage(1)
                }}
                style={{ ...selectStyle, minWidth: '80px' }}
              >
                <option value={5}>5</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* 검색 및 필터 섹션 */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            marginBottom: '30px',
            alignItems: 'center'
          }}>
            <select
              value={selectedProductStatus}
              onChange={(e) => {
                setSelectedProductStatus(e.target.value)
                setCurrentPage(1)
              }}
              style={selectStyle}
            >
              <option value="">판매상태</option>
              <option value="판매중">판매중</option>
              <option value="일시품절">일시품절</option>
              <option value="판매종료">판매종료</option>
            </select>
            <select
              value={selectedParentCategory}
              onChange={(e) => {
                setSelectedParentCategory(e.target.value)
                setSelectedCategory('')
                setCurrentPage(1)
              }}
              style={selectStyle}
            >
              <option value="">1차 카테고리</option>
              <option value="MAN">MAN</option>
              <option value="WOMAN">WOMAN</option>
              <option value="KIDS">KIDS</option>
              <option value="ACCESSORIES">ACCESSORIES</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              disabled={!selectedParentCategory}
              style={{
                ...selectStyle,
                backgroundColor: selectedParentCategory ? 'white' : '#f5f5f5'
              }}
            >
              <option value="">2차 카테고리</option>
              {filteredCategories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              placeholder="공급업체, 상품명, 관리자용상품명, 상품코드 검색"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #dcdde1',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />

            <button
              onClick={handleSearch}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              검색
            </button>
          </div>

          {/* 상품 목록 테이블 */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #e1e8ed'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={tableHeaderStyle}>정렬순서</th>
                  <th style={tableHeaderStyle}>공급업체</th>
                  <th style={tableHeaderStyle}>상품사진</th>
                  <th style={{ ...tableHeaderStyle, minWidth: '300px' }}>
                    카테고리 상품코드/상품명<br/>관리자용 상품명
                  </th>
                  <th style={tableHeaderStyle}>
                    시중가 할인가<br/>원가
                  </th>
                  <th style={tableHeaderStyle}>판매상태</th>
                  <th style={tableHeaderStyle}>편집</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={emptyMessageStyle}>
                      로딩 중...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={emptyMessageStyle}>
                      등록된 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} style={{ borderBottom: '1px solid #e1e8ed' }}>
                      <td style={tableCellStyle}>{product.sortOrder}</td>
                      <td style={tableCellStyle}>{product.supplierName}</td>
                      <td style={tableCellStyle}>
                        <Link 
                          to={`/product/${product._id}`}
                          style={{ 
                            position: 'relative', 
                            display: 'inline-block',
                            cursor: 'pointer'
                          }}
                        >
                          {product.listImage ? (
                            <img 
                              src={product.listImage} 
                              alt={product.name}
                              style={{ 
                                width: '80px', 
                                height: '80px', 
                                objectFit: 'cover',
                                borderRadius: '4px',
                                transition: 'opacity 0.2s'
                              }} 
                              onMouseOver={(e) => e.target.style.opacity = '0.8'}
                              onMouseOut={(e) => e.target.style.opacity = '1'}
                            />
                          ) : (
                            <div style={{
                              width: '80px',
                              height: '80px',
                              backgroundColor: '#f0f0f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#999'
                            }}>
                              이미지 없음
                            </div>
                          )}
                          {/* 이미지 개수 및 색상 옵션 표시 */}
                          {product.detailImages && product.detailImages.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              bottom: '5px',
                              left: '5px',
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '11px'
                            }}>
                              {product.detailImages.length.toString().padStart(2, '0')}
                            </div>
                          )}
                          {/* 색상 옵션 표시 */}
                          {product.colorOptions && product.colorOptions.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              bottom: '5px',
                              right: '5px',
                              display: 'flex',
                              gap: '2px'
                            }}>
                              {product.colorOptions.slice(0, 3).map((option, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: getColorCode(option.colorName),
                                    border: '1px solid white',
                                    borderRadius: '2px'
                                  }}
                                  title={option.colorName}
                                />
                              ))}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'left', padding: '12px' }}>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <div style={{ color: '#7f8c8d', marginBottom: '4px' }}>
                            {product.category?.parentCategory} &gt; {product.category?.name}
                          </div>
                          <div style={{ color: '#7f8c8d', marginBottom: '4px' }}>
                            {product.sku}
                          </div>
                          <Link
                            to={`/product/${product._id}`}
                            style={{ 
                              fontWeight: '600', 
                              color: '#2c3e50', 
                              marginBottom: '4px',
                              display: 'block',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#3498db'}
                            onMouseOut={(e) => e.target.style.color = '#2c3e50'}
                          >
                            {product.name}
                          </Link>
                          <div style={{ color: '#95a5a6' }}>
                            {product.adminName}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'right', padding: '12px' }}>
                        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                          <div style={{ 
                            textDecoration: 'line-through', 
                            color: '#95a5a6',
                            marginBottom: '4px'
                          }}>
                            {formatPrice(product.marketPrice)}원
                          </div>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#e74c3c',
                            fontSize: '15px',
                            marginBottom: '4px'
                          }}>
                            {formatPrice(product.price)}원
                          </div>
                          <div style={{ color: '#7f8c8d' }}>
                            ({formatPrice(product.costPrice)}원)
                          </div>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '500',
                          backgroundColor: getStatusColor(product.productStatus).bg,
                          color: getStatusColor(product.productStatus).text
                        }}>
                          {product.productStatus}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEdit(product._id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginTop: '30px',
              gap: '10px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 1 ? '#f0f0f0' : 'white',
                  color: currentPage === 1 ? '#ccc' : '#333',
                  border: '1px solid #dcdde1',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                이전
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: currentPage === page ? '#3498db' : 'white',
                    color: currentPage === page ? 'white' : '#333',
                    border: '1px solid #dcdde1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: currentPage === page ? '600' : '400'
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === totalPages ? '#f0f0f0' : 'white',
                  color: currentPage === totalPages ? '#ccc' : '#333',
                  border: '1px solid #dcdde1',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                다음
              </button>
            </div>
          )}

          {/* 총 상품 수 표시 */}
          {!loading && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px',
              color: '#7f8c8d',
              fontSize: '14px'
            }}>
              총 {total}개의 상품
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// 색상 코드 매핑 (간단한 예시)
const getColorCode = (colorName) => {
  const colorMap = {
    '빨강': '#e74c3c',
    '파랑': '#3498db',
    '노랑': '#f1c40f',
    '초록': '#27ae60',
    '검정': '#2c3e50',
    '흰색': '#ecf0f1',
    '회색': '#95a5a6',
    '주황': '#e67e22',
    '보라': '#9b59b6',
    '분홍': '#fd79a8'
  }
  
  // 색상명에 포함된 키워드로 매칭
  for (const [key, value] of Object.entries(colorMap)) {
    if (colorName && colorName.includes(key)) {
      return value
    }
  }
  
  return '#bdc3c7' // 기본 색상
}

// 판매상태별 색상
const getStatusColor = (status) => {
  const statusColors = {
    '판매중': { bg: '#d4edda', text: '#155724' },
    '일시품절': { bg: '#fff3cd', text: '#856404' },
    '판매종료': { bg: '#f8d7da', text: '#721c24' }
  }
  return statusColors[status] || { bg: '#e2e3e5', text: '#383d41' }
}

// 스타일
const selectStyle = {
  padding: '12px 16px',
  border: '1px solid #dcdde1',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: 'white',
  cursor: 'pointer',
  minWidth: '150px'
}

const tableHeaderStyle = {
  padding: '16px',
  textAlign: 'center',
  fontWeight: '600',
  fontSize: '14px',
  color: '#2c3e50',
  borderBottom: '2px solid #e1e8ed'
}

const tableCellStyle = {
  padding: '16px',
  textAlign: 'center',
  fontSize: '14px',
  color: '#2c3e50',
  verticalAlign: 'middle'
}

const emptyMessageStyle = {
  padding: '60px 20px',
  textAlign: 'center',
  color: '#7f8c8d',
  fontSize: '14px'
}

export default ProductManagement


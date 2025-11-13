import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader'

function CategoryManagement() {
  const navigate = useNavigate()
  const [selectedParentCategory, setSelectedParentCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)

  useEffect(() => {
    // 초기 로드 시 1차 카테고리 선택되지 않음
  }, [])

  // 1차 카테고리 선택 시 해당 2차 카테고리 목록 가져오기
  useEffect(() => {
    if (selectedParentCategory) {
      fetchCategories()
    } else {
      setCategories([])
    }
  }, [selectedParentCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/categories?parentCategory=${selectedParentCategory}&isActive=true`
      )
      const data = await response.json()
      if (data.success) {
        // sortOrder로 정렬
        const sortedCategories = data.data.sort((a, b) => a.sortOrder - b.sortOrder)
        setCategories(sortedCategories)
      }
    } catch (error) {
      console.error('카테고리 목록 가져오기 실패:', error)
      alert('카테고리 목록을 불러오는데 실패했습니다.')
    }
  }

  const handleAddCategory = async () => {
    if (!selectedParentCategory) {
      alert('1차 카테고리를 선택해주세요.')
      return
    }
    
    if (!newCategoryName.trim()) {
      alert('카테고리명을 입력해주세요.')
      return
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      // 마지막 정렬순서 계산
      const maxSortOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.sortOrder)) 
        : 0

      // 슬러그 생성 (타임스탬프 + 랜덤 문자열로 고유 슬러그 생성)
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const slug = `${selectedParentCategory.toLowerCase()}-${timestamp}-${randomStr}`

      const categoryData = {
        name: newCategoryName.trim(),
        slug: slug,
        parentCategory: selectedParentCategory,
        sortOrder: maxSortOrder + 1,
        isActive: true
      }

      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      })

      const data = await response.json()

      if (data.success) {
        alert('카테고리가 추가되었습니다.')
        setNewCategoryName('')
        fetchCategories()
      } else {
        alert(data.message || '카테고리 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('카테고리 추가 실패:', error)
      alert('카테고리 추가 중 오류가 발생했습니다.')
    }
  }

  const handleReorder = async (categoryId, direction) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ direction })
      })

      const data = await response.json()

      if (data.success) {
        fetchCategories()
      } else {
        alert(data.message || '순서 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('순서 변경 실패:', error)
      alert('순서 변경 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory({
      ...category,
      newName: category.name
    })
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
  }

  const handleSaveEdit = async () => {
    if (!editingCategory.newName.trim()) {
      alert('카테고리명을 입력해주세요.')
      return
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      // 수정 시에는 기존 슬러그 유지
      const response = await fetch(`http://localhost:5000/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingCategory.newName.trim(),
          slug: editingCategory.slug, // 기존 슬러그 유지
          parentCategory: editingCategory.parentCategory,
          sortOrder: editingCategory.sortOrder,
          isActive: editingCategory.isActive
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('카테고리가 수정되었습니다.')
        setEditingCategory(null)
        fetchCategories()
      } else {
        alert(data.message || '카테고리 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('카테고리 수정 실패:', error)
      alert('카테고리 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        alert('카테고리가 삭제되었습니다.')
        fetchCategories()
      } else {
        alert(data.message || '카테고리 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('카테고리 삭제 실패:', error)
      alert('카테고리 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AdminHeader />
      
      <main style={{ padding: '40px' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* 페이지 제목 */}
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            marginBottom: '30px',
            color: '#2c3e50'
          }}>
            상품카테고리 관리
          </h1>

          {/* 카테고리 추가 섹션 */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            marginBottom: '40px',
            alignItems: 'center'
          }}>
            <select
              value={selectedParentCategory}
              onChange={(e) => setSelectedParentCategory(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #dcdde1',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="">1차 카테고리</option>
              <option value="MAN">MAN</option>
              <option value="WOMAN">WOMAN</option>
              <option value="KIDS">KIDS</option>
              <option value="ACCESSORIES">ACCESSORIES</option>
            </select>

            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="2차 카테고리명 입력"
              disabled={!selectedParentCategory}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCategory()
                }
              }}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #dcdde1',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: selectedParentCategory ? 'white' : '#f5f5f5'
              }}
            />

            <button
              onClick={handleAddCategory}
              disabled={!selectedParentCategory}
              style={{
                padding: '12px 24px',
                backgroundColor: selectedParentCategory ? '#3498db' : '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: selectedParentCategory ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap'
              }}
            >
              추가하기
            </button>
          </div>

          {/* 2차 카테고리 목록 테이블 */}
          {selectedParentCategory && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                border: '1px solid #e1e8ed'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={tableHeaderStyle}>정렬순서</th>
                    <th style={tableHeaderStyle}>2차 카테고리명</th>
                    <th style={tableHeaderStyle}>순서변경</th>
                    <th style={tableHeaderStyle}>편집</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#7f8c8d',
                        fontSize: '14px'
                      }}>
                        등록된 2차 카테고리가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category, index) => (
                      <tr key={category._id} style={{ 
                        borderBottom: '1px solid #e1e8ed',
                        backgroundColor: 'white'
                      }}>
                        <td style={tableCellStyle}>{category.sortOrder}</td>
                        <td style={tableCellStyle}>
                          {editingCategory && editingCategory._id === category._id ? (
                            <input
                              type="text"
                              value={editingCategory.newName}
                              onChange={(e) => setEditingCategory({
                                ...editingCategory,
                                newName: e.target.value
                              })}
                              style={{
                                padding: '8px 12px',
                                border: '1px solid #3498db',
                                borderRadius: '4px',
                                fontSize: '14px',
                                width: '100%'
                              }}
                            />
                          ) : (
                            category.name
                          )}
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleReorder(category._id, 'up')}
                              disabled={index === 0}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'white',
                                border: '1px solid #dcdde1',
                                borderRadius: '4px',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                opacity: index === 0 ? 0.5 : 1
                              }}
                              title="위로"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleReorder(category._id, 'down')}
                              disabled={index === categories.length - 1}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'white',
                                border: '1px solid #dcdde1',
                                borderRadius: '4px',
                                cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                opacity: index === categories.length - 1 ? 0.5 : 1
                              }}
                              title="아래로"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          {editingCategory && editingCategory._id === category._id ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={handleSaveEdit}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#27ae60',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                저장
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#95a5a6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEdit(category)}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#3498db',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDelete(category._id, category.name)}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!selectedParentCategory && (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#7f8c8d',
              fontSize: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              1차 카테고리를 선택하면 해당 카테고리의 2차 카테고리 목록이 표시됩니다.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// 테이블 스타일
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
  color: '#2c3e50'
}

export default CategoryManagement


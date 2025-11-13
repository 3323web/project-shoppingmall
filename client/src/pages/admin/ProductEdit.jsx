import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminHeader from '../../components/AdminHeader'

function ProductEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [categories, setCategories] = useState([])
  const [selectedParentCategory, setSelectedParentCategory] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [listImagePreview, setListImagePreview] = useState('')
  const [detailImagePreviews, setDetailImagePreviews] = useState([])
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    adminName: '',
    category: '',
    productStatus: '판매중',
    supplierType: '상품업체',
    supplierName: '',
    marketPrice: '',
    price: '',
    costPrice: '',
    material: '',
    notes: '',
    sortOrder: '',
    description: '',
    listImage: '',
    detailImages: [],
    colorOptions: '',
    sizeOptions: '',
    customOptions: [{ optionName: '', optionValues: '' }]
  })

  useEffect(() => {
    // 카테고리 목록 가져오기
    fetchCategories()
    // 상품 데이터 가져오기
    fetchProduct()
  }, [id])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories?isActive=true')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('카테고리 목록 가져오기 실패:', error)
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`)
      const data = await response.json()
      
      if (data.success) {
        const product = data.data
        
        // 카테고리 정보 설정
        if (product.category) {
          setSelectedParentCategory(product.category.parentCategory)
          setSelectedCategories([product.category])
        }
        
        // 이미지 미리보기 설정
        if (product.listImage) {
          setListImagePreview(product.listImage)
        }
        if (product.detailImages && product.detailImages.length > 0) {
          setDetailImagePreviews(product.detailImages)
        }
        
        // 색상 옵션을 문자열로 변환
        const colorOptionsStr = product.colorOptions?.map(opt => 
          `${opt.optionOrder}, ${opt.colorName}, ${opt.costPrice}, ${opt.price}`
        ).join('\n') || ''
        
        // 사이즈 옵션을 문자열로 변환
        const sizeOptionsStr = product.sizeOptions?.map(opt => 
          `${opt.optionOrder}, ${opt.sizeName}, ${opt.costPrice}, ${opt.price}`
        ).join('\n') || ''
        
        // 추가 옵션을 문자열로 변환
        const customOptions = product.customOptions && product.customOptions.length > 0
          ? product.customOptions.map(opt => ({
              optionName: opt.optionName,
              optionValues: opt.optionValues?.map(val => 
                `${val.optionOrder}, ${val.valueName}, ${val.costPrice}, ${val.price}`
              ).join('\n') || ''
            }))
          : [{ optionName: '', optionValues: '' }]
        
        // 폼 데이터 설정
        setFormData({
          sku: product.sku || '',
          name: product.name || '',
          adminName: product.adminName || '',
          category: product.category?._id || '',
          productStatus: product.productStatus || '판매중',
          supplierType: product.supplierType || '상품업체',
          supplierName: product.supplierName || '',
          marketPrice: product.marketPrice || '',
          price: product.price || '',
          costPrice: product.costPrice || '',
          material: product.material || '',
          notes: product.notes || '',
          sortOrder: product.sortOrder || '',
          description: product.description || '',
          listImage: product.listImage || '',
          detailImages: product.detailImages || [],
          colorOptions: colorOptionsStr,
          sizeOptions: sizeOptionsStr,
          customOptions: customOptions
        })
      } else {
        alert('상품을 찾을 수 없습니다.')
        navigate('/admin/product-management')
      }
    } catch (error) {
      console.error('상품 조회 실패:', error)
      alert('상품 정보를 불러오는데 실패했습니다.')
      navigate('/admin/product-management')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddCategory = () => {
    if (selectedParentCategory && formData.category) {
      const category = categories.find(c => c._id === formData.category)
      if (category && !selectedCategories.find(sc => sc._id === category._id)) {
        setSelectedCategories(prev => [...prev, category])
      }
    }
  }

  const handleRemoveCategory = (categoryId) => {
    setSelectedCategories(prev => prev.filter(c => c._id !== categoryId))
  }

  // Cloudinary 위젯 열기 - 목록 이미지
  const openListImageWidget = () => {
    if (!window.cloudinary) {
      alert('Cloudinary 위젯을 로드하는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary 설정이 올바르지 않습니다. 환경변수를 확인해주세요.')
      return
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        clientAllowedFormats: ['image'],
        maxImageFileSize: 5000000, // 5MB
        folder: 'products/list',
        tags: ['product', 'list']
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url
          setFormData(prev => ({ ...prev, listImage: imageUrl }))
          setListImagePreview(imageUrl)
        }
      }
    )
  }

  // Cloudinary 위젯 열기 - 상세 이미지
  const openDetailImagesWidget = () => {
    if (!window.cloudinary) {
      alert('Cloudinary 위젯을 로드하는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary 설정이 올바르지 않습니다. 환경변수를 확인해주세요.')
      return
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: true,
        maxFiles: 10,
        clientAllowedFormats: ['image'],
        maxImageFileSize: 5000000, // 5MB
        folder: 'products/detail',
        tags: ['product', 'detail']
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url
          setFormData(prev => ({
            ...prev,
            detailImages: [...prev.detailImages, imageUrl]
          }))
          setDetailImagePreviews(prev => [...prev, imageUrl])
        }
      }
    )
  }

  // 목록 이미지 삭제
  const removeListImage = () => {
    setFormData(prev => ({ ...prev, listImage: '' }))
    setListImagePreview('')
  }

  // 상세 이미지 삭제
  const removeDetailImage = (index) => {
    setFormData(prev => ({
      ...prev,
      detailImages: prev.detailImages.filter((_, i) => i !== index)
    }))
    setDetailImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        alert('로그인이 필요합니다.')
        return
      }

      // 필수 필드 체크
      if (!formData.sku || !formData.name || !formData.adminName || 
          !formData.supplierName || !formData.marketPrice || 
          !formData.price || !formData.costPrice) {
        alert('필수 항목을 모두 입력해주세요.')
        return
      }

      // 색상 옵션 파싱
      const colorOptions = formData.colorOptions ? 
        formData.colorOptions.split('\n').map(line => {
          const [optionOrder, colorName, costPrice, price] = line.split(',').map(s => s.trim())
          return {
            optionOrder: parseInt(optionOrder),
            colorName,
            costPrice: parseFloat(costPrice),
            price: parseFloat(price)
          }
        }).filter(opt => opt.optionOrder && opt.colorName) : []

      // 사이즈 옵션 파싱
      const sizeOptions = formData.sizeOptions ? 
        formData.sizeOptions.split('\n').map(line => {
          const [optionOrder, sizeName, costPrice, price] = line.split(',').map(s => s.trim())
          return {
            optionOrder: parseInt(optionOrder),
            sizeName,
            costPrice: parseFloat(costPrice),
            price: parseFloat(price)
          }
        }).filter(opt => opt.optionOrder && opt.sizeName) : []

      // 추가 옵션 파싱
      const customOptions = formData.customOptions
        .filter(opt => opt.optionName && opt.optionValues)
        .map(opt => ({
          optionName: opt.optionName,
          optionValues: opt.optionValues.split('\n').map(line => {
            const [optionOrder, valueName, costPrice, price] = line.split(',').map(s => s.trim())
            return {
              optionOrder: parseInt(optionOrder),
              valueName,
              costPrice: parseFloat(costPrice),
              price: parseFloat(price)
            }
          }).filter(val => val.optionOrder && val.valueName)
        }))

      const productData = {
        sku: formData.sku.toUpperCase(),
        name: formData.name,
        adminName: formData.adminName,
        category: selectedCategories.length > 0 ? selectedCategories[0]._id : null,
        productStatus: formData.productStatus,
        supplierType: formData.supplierType,
        supplierName: formData.supplierName,
        marketPrice: parseFloat(formData.marketPrice),
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        material: formData.material,
        notes: formData.notes,
        sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : 1,
        description: formData.description,
        listImage: formData.listImage,
        detailImages: formData.detailImages,
        colorOptions,
        sizeOptions,
        customOptions
      }

      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      })

      const data = await response.json()

      if (data.success) {
        alert('상품이 수정되었습니다.')
        navigate('/admin/product-management')
      } else {
        alert(data.message || '상품 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('상품 수정 실패:', error)
      alert('상품 수정 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = () => {
    if (window.confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      navigate('/admin/product-management')
    }
  }

  const filteredCategories = selectedParentCategory 
    ? categories.filter(c => c.parentCategory === selectedParentCategory)
    : []

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <AdminHeader />
        <div style={{ padding: '100px', textAlign: 'center' }}>
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AdminHeader />
      <div style={{ padding: '40px' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
        {/* Header */}
        <div style={{ 
          padding: '30px 40px',
          borderBottom: '2px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>상품수정</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#e74c3c', fontSize: '14px' }}>*항목은 필수입력 항목입니다.</span>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 24px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              취소
            </button>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '40px' }}>
          {/* 상품코드(SKU) */}
          <FormRow label="* 상품코드(SKU)">
            <div>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                style={inputStyle}
                disabled
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                *고유번호 (수정 불가)
              </div>
            </div>
          </FormRow>

          {/* 상품카테고리 */}
          <FormRow label="* 상품카테고리">
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select
                  value={selectedParentCategory}
                  onChange={(e) => setSelectedParentCategory(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">1차 카테고리</option>
                  <option value="MAN">MAN</option>
                  <option value="WOMAN">WOMAN</option>
                  <option value="KIDS">KIDS</option>
                  <option value="ACCESSORIES">ACCESSORIES</option>
                </select>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={selectStyle}
                  disabled={!selectedParentCategory}
                >
                  <option value="">2차 카테고리</option>
                  {filteredCategories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddCategory}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  카테고리 추가
                </button>
              </div>
              {selectedCategories.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedCategories.map(category => (
                    <div
                      key={category._id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#ecf0f1',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <span>{category.parentCategory} &gt; {category.name}</span>
                      <button
                        onClick={() => handleRemoveCategory(category._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#7f8c8d',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: 0
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormRow>

          {/* 판매상태 */}
          <FormRow label="* 판매상태">
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="productStatus"
                  value="판매중"
                  checked={formData.productStatus === '판매중'}
                  onChange={handleInputChange}
                />
                <span>판매중</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="productStatus"
                  value="일시품절"
                  checked={formData.productStatus === '일시품절'}
                  onChange={handleInputChange}
                />
                <span>일시품절</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="productStatus"
                  value="판매종료"
                  checked={formData.productStatus === '판매종료'}
                  onChange={handleInputChange}
                />
                <span>판매종료</span>
              </label>
            </div>
          </FormRow>

          {/* 공급업체 */}
          <FormRow label="* 공급업체">
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                name="supplierType"
                value={formData.supplierType}
                onChange={handleInputChange}
                style={{ ...selectStyle, width: '200px' }}
              >
                <option value="상품업체">상품업체</option>
                <option value="인쇄업체">인쇄업체</option>
                <option value="배송업체">배송업체</option>
                <option value="기타업체">기타업체</option>
              </select>
              <input
                type="text"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleInputChange}
                placeholder="공급업체명"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </FormRow>

          {/* 상품명 */}
          <FormRow label="* 상품명">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{ ...inputStyle, flex: 1 }}
              />
              <span style={{ fontSize: '14px', color: '#555', whiteSpace: 'nowrap' }}>관리자용 상품명</span>
              <input
                type="text"
                name="adminName"
                value={formData.adminName}
                onChange={handleInputChange}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </FormRow>

          {/* 상품이미지 */}
          <FormRow label="* 상품이미지">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 목록이미지 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ width: '100px', fontSize: '14px', fontWeight: '500' }}>목록이미지</span>
                  <button
                    type="button"
                    onClick={openListImageWidget}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    파일선택
                  </button>
                  {formData.listImage && (
                    <span style={{ fontSize: '13px', color: '#7f8c8d' }}>
                      이미지 업로드 완료
                    </span>
                  )}
                </div>
                {listImagePreview && (
                  <div style={{ 
                    position: 'relative', 
                    display: 'inline-block',
                    marginLeft: '110px'
                  }}>
                    <img 
                      src={listImagePreview} 
                      alt="목록 이미지 미리보기" 
                      style={{ 
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #e1e8ed'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={removeListImage}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* 상세이미지 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ width: '100px', fontSize: '14px', fontWeight: '500' }}>상세이미지</span>
                  <button
                    type="button"
                    onClick={openDetailImagesWidget}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    파일선택
                  </button>
                  {formData.detailImages.length > 0 && (
                    <span style={{ fontSize: '13px', color: '#7f8c8d' }}>
                      {formData.detailImages.length}개 이미지 업로드됨
                    </span>
                  )}
                </div>
                {detailImagePreviews.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    flexWrap: 'wrap',
                    marginLeft: '110px'
                  }}>
                    {detailImagePreviews.map((preview, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          position: 'relative', 
                          display: 'inline-block'
                        }}
                      >
                        <img 
                          src={preview} 
                          alt={`상세 이미지 ${index + 1}`} 
                          style={{ 
                            width: '150px', 
                            height: '150px', 
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #e1e8ed'
                          }} 
                        />
                        <button
                          type="button"
                          onClick={() => removeDetailImage(index)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FormRow>

          {/* 상품가/원가 */}
          <FormRow label="* 상품가/원가">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>시중가</span>
                <input
                  type="number"
                  name="marketPrice"
                  value={formData.marketPrice}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, width: '150px' }}
                />
                <span>원</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>할인가</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, width: '150px' }}
                />
                <span>원</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>공급원가</span>
                <input
                  type="number"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleInputChange}
                  style={{ ...inputStyle, width: '150px' }}
                />
                <span>원</span>
              </div>
            </div>
          </FormRow>

          {/* 추가옵션 */}
          <FormRow label="추가옵션">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="옵션명"
                  value={formData.customOptions[0]?.optionName || ''}
                  onChange={(e) => {
                    const newCustomOptions = [...formData.customOptions]
                    newCustomOptions[0] = { ...newCustomOptions[0], optionName: e.target.value }
                    setFormData(prev => ({ ...prev, customOptions: newCustomOptions }))
                  }}
                  style={{ ...inputStyle, width: '200px' }}
                />
                <textarea
                  placeholder="옵션 (한 줄에 하나씩 입력)"
                  value={formData.customOptions[0]?.optionValues || ''}
                  onChange={(e) => {
                    const newCustomOptions = [...formData.customOptions]
                    newCustomOptions[0] = { ...newCustomOptions[0], optionValues: e.target.value }
                    setFormData(prev => ({ ...prev, customOptions: newCustomOptions }))
                  }}
                  style={{ ...textareaStyle, flex: 1, minHeight: '80px' }}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                *입력형식 : (번호, 옵션항목, 옵션원가, 옵션판매가)
              </div>
            </div>
          </FormRow>

          {/* 색상옵션 */}
          <FormRow label="색상옵션">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <textarea
                name="colorOptions"
                value={formData.colorOptions}
                onChange={handleInputChange}
                placeholder="한 줄에 하나씩 입력&#10;예: 1, 화이트, 0, 0"
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                *입력형식 : (번호, 색상명, 옵션원가, 옵션판매가)
              </div>
            </div>
          </FormRow>

          {/* 사이즈옵션 */}
          <FormRow label="사이즈옵션">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <textarea
                name="sizeOptions"
                value={formData.sizeOptions}
                onChange={handleInputChange}
                placeholder="한 줄에 하나씩 입력&#10;예: 1, S, 0, 0"
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                *입력형식 : (번호, 사이즈명, 옵션원가, 옵션판매가)
              </div>
            </div>
          </FormRow>

          {/* 제품소재 */}
          <FormRow label="제품소재">
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              style={inputStyle}
            />
          </FormRow>

          {/* 참고사항 */}
          <FormRow label="참고사항">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                style={inputStyle}
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                *HTML 태그 사용가능
              </div>
            </div>
          </FormRow>

          {/* 상품순서 */}
          <FormRow label="상품순서">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
                style={{ ...inputStyle, width: '150px' }}
              />
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                *미입력시 기본값 1
              </div>
            </div>
          </FormRow>

          {/* 상세설명 */}
          <FormRow label="상세설명">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                <button
                  type="button"
                  onClick={() => setShowDescriptionPreview(!showDescriptionPreview)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: showDescriptionPreview ? '#3498db' : '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {showDescriptionPreview ? 'HTML 편집' : '미리보기'}
                </button>
              </div>
              
              {showDescriptionPreview ? (
                <div
                  style={{
                    border: '1px solid #dcdde1',
                    borderRadius: '4px',
                    padding: '15px',
                    minHeight: '200px',
                    backgroundColor: 'white',
                    overflow: 'auto'
                  }}
                  dangerouslySetInnerHTML={{ __html: formData.description || '<p style="color: #999;">내용이 없습니다.</p>' }}
                />
              ) : (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="HTML 태그를 직접 입력하세요. 예: &lt;p&gt;내용&lt;/p&gt; 또는 &lt;img src=&quot;이미지주소&quot; /&gt;"
                  style={{ ...textareaStyle, minHeight: '200px', fontFamily: 'monospace', fontSize: '13px' }}
                />
              )}
              
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                * HTML 태그를 직접 입력할 수 있습니다. 미리보기 버튼으로 확인하세요.
              </div>
            </div>
          </FormRow>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '30px 40px',
          borderTop: '2px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'center',
          gap: '15px'
        }}>
          <button
            onClick={handleSave}
            style={{
              padding: '12px 40px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            저장
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: '12px 40px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

// Form Row Component
function FormRow({ label, children }) {
  return (
    <div style={{ 
      display: 'flex',
      marginBottom: '25px',
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: '200px',
        paddingTop: '10px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#2c3e50',
        backgroundColor: '#f8f9fa',
        padding: '12px 20px',
        marginRight: '20px'
      }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}

// Styles
const inputStyle = {
  padding: '10px 12px',
  border: '1px solid #dcdde1',
  borderRadius: '4px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box'
}

const selectStyle = {
  padding: '10px 12px',
  border: '1px solid #dcdde1',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: 'white',
  cursor: 'pointer',
  flex: 1
}

const textareaStyle = {
  padding: '10px 12px',
  border: '1px solid #dcdde1',
  borderRadius: '4px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  resize: 'vertical'
}

export default ProductEdit


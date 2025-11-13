import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartService } from '../services/cartService'
import { orderService } from '../services/orderService'

function Checkout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isBuyNow, setIsBuyNow] = useState(false)

  // 배송지 정보
  const [deliveryInfo, setDeliveryInfo] = useState({
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address: '',
    detailAddress: '',
    deliveryRequest: '부재시 문앞에 놓아주세요',
    shippingFee: 0
  })

  // 결제 정보
  const [paymentMethod, setPaymentMethod] = useState('카드결제')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    // 구매하기용 아이템이 있는지 확인
    const buyNowItems = sessionStorage.getItem('buyNowItems')
    
    if (buyNowItems) {
      // 구매하기 모드: sessionStorage의 아이템만 사용
      try {
        const items = JSON.parse(buyNowItems)
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
        const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
        
        setCart({
          items: items.map(item => ({
            _id: `buynow_${Date.now()}_${Math.random()}`,
            product: item.product,
            selectedOptions: item.selectedOptions,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          totalQuantity,
          totalAmount
        })
        setIsBuyNow(true)
        setLoading(false)
      } catch (error) {
        console.error('구매하기 아이템 파싱 실패:', error)
        sessionStorage.removeItem('buyNowItems')
        fetchCart()
      }
    } else {
      // 일반 모드: 장바구니 전체 불러오기
      fetchCart()
    }
    
    // 포트원(아임포트) 초기화 - 스크립트 로드 대기
    const initPortOne = () => {
      if (window.IMP) {
        try {
          window.IMP.init('imp24642671')
        } catch (error) {
          console.error('포트원 초기화 실패:', error)
        }
      } else {
        // 스크립트가 아직 로드되지 않았으면 재시도
        setTimeout(initPortOne, 100)
      }
    }
    
    // DOM이 완전히 로드된 후 초기화
    if (document.readyState === 'complete') {
      initPortOne()
    } else {
      window.addEventListener('load', initPortOne)
      return () => window.removeEventListener('load', initPortOne)
    }
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
        
        // 장바구니가 비어있으면 장바구니 페이지로 이동
        if (!response.data || response.data.items.length === 0) {
          alert('장바구니가 비어있습니다.')
          navigate('/cart')
          return
        }
      }
    } catch (error) {
      console.error('장바구니 조회 실패:', error)
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
        navigate('/login')
      } else {
        alert('장바구니를 불러오는데 실패했습니다.')
        navigate('/cart')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeliveryChange = (field, value) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressSearch = () => {
    // 다음 우편번호 서비스가 로드되었는지 확인
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    // 다음 우편번호 서비스 팝업 열기
    new window.daum.Postcode({
      oncomplete: function(data) {
        // 사용자가 선택한 주소 정보
        let addr = '' // 주소 변수
        let extraAddr = '' // 참고항목 변수

        // 사용자가 도로명 주소를 선택했을 경우
        if (data.userSelectedType === 'R') {
          addr = data.roadAddress
        } else {
          // 사용자가 지번 주소를 선택했을 경우
          addr = data.jibunAddress
        }

        // 사용자가 선택한 주소 타입이 도로명 타입일 경우 참고항목을 조합
        if (data.userSelectedType === 'R') {
          // 법정동명이 있을 경우 추가
          if (data.bname !== '') {
            extraAddr += data.bname
          }
          // 건물명이 있을 경우 추가
          if (data.buildingName !== '') {
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName)
          }
          // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다
          if (extraAddr !== '') {
            extraAddr = ' (' + extraAddr + ')'
          }
        }

        // 우편번호와 주소 정보를 해당 필드에 넣는다
        setDeliveryInfo(prev => ({
          ...prev,
          postalCode: data.zonecode, // 우편번호
          address: addr + extraAddr,  // 주소 (도로명 주소 + 참고항목)
          detailAddress: '' // 상세주소는 사용자가 직접 입력하도록 초기화
        }))

        // 상세주소 입력 필드에 포커스
        // React에서는 ref를 사용하거나 setTimeout으로 처리
        setTimeout(() => {
          const detailInput = document.querySelector('input[placeholder="상세주소"]')
          if (detailInput) {
            detailInput.focus()
          }
        }, 100)
      },
      width: '100%',
      height: '100%',
      maxSuggestItems: 5
    }).open({
      // 팝업 창을 중앙에 위치시키기 위한 설정
      popupName: 'postcodePopup',
      left: (window.screen.width / 2) - (500 / 2),
      top: (window.screen.height / 2) - (600 / 2)
    })
  }

  const handleSubmit = async () => {
    // 유효성 검사
    if (!deliveryInfo.recipientName.trim()) {
      alert('수령인 이름을 입력해주세요.')
      return
    }

    if (!deliveryInfo.recipientPhone.trim()) {
      alert('휴대폰 번호를 입력해주세요.')
      return
    }

    if (!deliveryInfo.address.trim()) {
      alert('배송 주소를 입력해주세요.')
      return
    }

    if (!agreedToTerms) {
      alert('주문 내용 확인 및 결제 동의에 체크해주세요.')
      return
    }

    // 포트원이 로드되지 않은 경우
    if (!window.IMP) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    // 무통장입금의 경우 포트원 결제 없이 바로 주문 생성
    if (paymentMethod === '무통장입금') {
      await createOrderDirectly()
      return
    }

    // 포트원 결제 요청
    try {
      setSubmitting(true)

      // 결제 전에 주문을 먼저 생성 (결제 대기 상태)
      const orderData = {
        delivery: {
          recipientName: deliveryInfo.recipientName,
          recipientPhone: deliveryInfo.recipientPhone,
          postalCode: deliveryInfo.postalCode || '',
          address: deliveryInfo.address,
          detailAddress: deliveryInfo.detailAddress || '',
          deliveryRequest: deliveryInfo.deliveryRequest || '',
          shippingFee: deliveryInfo.shippingFee || 0
        },
        payment: {
          method: paymentMethod
        },
        orderMemo: ''
      }

      // 구매하기 모드인 경우 items 배열을 직접 전달 (장바구니는 그대로 유지)
      let currentCart = cart
      if (isBuyNow) {
        const buyNowItems = JSON.parse(sessionStorage.getItem('buyNowItems') || '[]')
        // orderData에 items 배열 추가
        orderData.items = buyNowItems.map(item => ({
          productId: item.productId,
          selectedOptions: item.selectedOptions,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
        
        // 구매하기 모드에서는 클라이언트에서 계산한 금액 사용
        const totalQuantity = buyNowItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalAmount = buyNowItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
        
        currentCart = {
          items: buyNowItems.map(item => ({
            _id: `buynow_${Date.now()}_${Math.random()}`,
            product: item.product,
            selectedOptions: item.selectedOptions,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          totalQuantity,
          totalAmount
        }
      }

      // 주문 먼저 생성
      const orderResponse = await orderService.createOrder(orderData)
      
      if (!orderResponse.success) {
        alert(orderResponse.message || '주문 생성에 실패했습니다. 다시 시도해주세요.')
        setSubmitting(false)
        return
      }

      // 구매하기 모드인 경우 sessionStorage 정리
      if (isBuyNow) {
        sessionStorage.removeItem('buyNowItems')
      }

      const orderId = orderResponse.data._id
      const merchantUid = orderResponse.data.orderNumber || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 포트원이 로드되었는지 확인
      if (!window.IMP) {
        alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
        setSubmitting(false)
        return
      }

      const { IMP } = window

      try {
        IMP.request_pay({
        pg : 'html5_inicis',
        pay_method : 'card',
        merchant_uid: merchantUid,
        name: currentCart.items.length === 1 
          ? currentCart.items[0].product.name 
          : `${currentCart.items[0].product.name} 외 ${currentCart.items.length - 1}개`,
        amount: currentCart.totalAmount,
        buyer_email: '', // 사용자 이메일 (필요시 추가)
        buyer_name: deliveryInfo.recipientName,
        buyer_tel: deliveryInfo.recipientPhone,
        buyer_addr: `${deliveryInfo.address} ${deliveryInfo.detailAddress || ''}`,
        buyer_postcode: deliveryInfo.postalCode || '',
        m_redirect_url: `${window.location.origin}/order-complete/${orderId}`
      }, async (rsp) => {
        // 결제 완료 후 콜백
        if (rsp.success) {
          try {
            // 결제 정보 업데이트 (imp_uid 포함)
            await orderService.updatePayment(orderId, {
              paymentStatus: '결제완료',
              approvalNumber: rsp.apply_num || '',
              transactionId: rsp.merchant_uid || merchantUid,
              impUid: rsp.imp_uid || '', // 포트원 결제 고유번호
              paidAt: new Date().toISOString()
            })

            // 주문 완료 페이지로 이동
            navigate(`/order-complete/${orderId}`)
          } catch (error) {
            console.error('결제 정보 업데이트 실패:', error)
            alert('결제는 완료되었지만 주문 정보 업데이트에 실패했습니다. 고객센터로 문의해주세요.')
            setSubmitting(false)
          }
        } else {
          // 결제 실패 - 주문 취소
          try {
            await orderService.cancelOrder(orderId, {
              reason: `결제 실패: ${rsp.error_msg || '알 수 없는 오류'}`
            })
          } catch (cancelError) {
            console.error('주문 취소 실패:', cancelError)
          }
          alert(`결제에 실패했습니다: ${rsp.error_msg || '알 수 없는 오류'}`)
          setSubmitting(false)
        }
        })
      } catch (payError) {
        console.error('포트원 결제 요청 실패:', payError)
        alert('결제 모듈 실행 중 오류가 발생했습니다. 다시 시도해주세요.')
        setSubmitting(false)
      }
    } catch (error) {
      console.error('결제 요청 실패:', error)
      const errorMessage = error.response?.data?.message || '결제 요청 중 오류가 발생했습니다.'
      alert(errorMessage)
      setSubmitting(false)
    }
  }

  // 무통장입금 등 포트원을 사용하지 않는 결제 방법
  const createOrderDirectly = async () => {
    try {
      setSubmitting(true)

      const orderData = {
        delivery: {
          recipientName: deliveryInfo.recipientName,
          recipientPhone: deliveryInfo.recipientPhone,
          postalCode: deliveryInfo.postalCode,
          address: deliveryInfo.address,
          detailAddress: deliveryInfo.detailAddress,
          deliveryRequest: deliveryInfo.deliveryRequest,
          shippingFee: deliveryInfo.shippingFee
        },
        payment: {
          method: paymentMethod
        },
        orderMemo: ''
      }

      // 구매하기 모드인 경우 items 배열 추가
      if (isBuyNow) {
        const buyNowItems = JSON.parse(sessionStorage.getItem('buyNowItems') || '[]')
        orderData.items = buyNowItems.map(item => ({
          productId: item.productId,
          selectedOptions: item.selectedOptions,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }

      const response = await orderService.createOrder(orderData)

      if (response.success) {
        // 구매하기 모드인 경우 sessionStorage 정리
        if (isBuyNow) {
          sessionStorage.removeItem('buyNowItems')
        }
        // 주문 완료 페이지로 이동
        navigate(`/order-complete/${response.data._id}`)
      }
    } catch (error) {
      console.error('주문 실패:', error)
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
        navigate('/login')
      } else {
        alert(error.response?.data?.message || '주문 처리 중 오류가 발생했습니다.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // 결제 수단에 따른 PG사 설정
  const getPaymentGateway = (method) => {
    switch (method) {
      case '카드결제':
        return 'html5_inicis' // 이니시스 (필요시 변경 가능)
      case '간편결제':
        return 'kakaopay' // 카카오페이 (필요시 변경 가능)
      case '계좌이체':
        return 'html5_inicis' // 이니시스 (필요시 변경 가능)
      default:
        return 'html5_inicis'
    }
  }

  // 결제 수단에 따른 pay_method 설정
  const getPayMethod = (method) => {
    switch (method) {
      case '카드결제':
        return 'card'
      case '간편결제':
        return 'kakaopay'
      case '계좌이체':
        return 'trans'
      default:
        return 'card'
    }
  }

  if (loading) {
    return (
      <div style={loadingStyle}>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return null
  }

  return (
    <div style={containerStyle}>
      {/* 헤더 */}
      <div style={headerStyle}>
        <h1 style={pageTitleStyle}>주문결제</h1>
        <div style={breadcrumbStyle}>
          장바구니 &gt; <span style={breadcrumbActiveStyle}>주문결제</span> &gt; 주문완료
        </div>
      </div>

      <div style={contentWrapperStyle}>
        {/* 왼쪽: 배송지 정보 및 결제수단 */}
        <div style={leftSectionStyle}>
          {/* 배송지 정보 */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <span style={iconStyle}>📍</span>
              배송지 정보
            </h2>

            <div style={formGroupStyle}>
              <label style={labelStyle}>이름</label>
              <input
                type="text"
                value={deliveryInfo.recipientName}
                onChange={(e) => handleDeliveryChange('recipientName', e.target.value)}
                placeholder="수령인 이름"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>휴대폰</label>
              <input
                type="text"
                value={deliveryInfo.recipientPhone}
                onChange={(e) => handleDeliveryChange('recipientPhone', e.target.value)}
                placeholder="010-1234-5678"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>배송주소</label>
              <div style={addressInputWrapperStyle}>
                <input
                  type="text"
                  value={deliveryInfo.postalCode}
                  onChange={(e) => handleDeliveryChange('postalCode', e.target.value)}
                  placeholder="우편번호"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={handleAddressSearch} style={addressSearchButtonStyle}>
                  주소찾기
                </button>
              </div>
            </div>

            <div style={formGroupStyle}>
              <input
                type="text"
                value={deliveryInfo.address}
                onChange={(e) => handleDeliveryChange('address', e.target.value)}
                placeholder="도로명 주소"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <input
                type="text"
                value={deliveryInfo.detailAddress}
                onChange={(e) => handleDeliveryChange('detailAddress', e.target.value)}
                placeholder="상세주소"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>배송 메세지</label>
              <input
                type="text"
                value={deliveryInfo.deliveryRequest}
                onChange={(e) => handleDeliveryChange('deliveryRequest', e.target.value)}
                placeholder="배송 요청사항"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 결제수단 */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>결제수단</h2>

            <div style={paymentOptionsStyle}>
              <label style={{
                ...paymentOptionStyle,
                borderColor: paymentMethod === '카드결제' ? '#4a90e2' : '#ddd',
                backgroundColor: paymentMethod === '카드결제' ? '#f0f7ff' : '#ffffff'
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="카드결제"
                  checked={paymentMethod === '카드결제'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={radioStyle}
                />
                <span>신용카드</span>
              </label>

              <label style={{
                ...paymentOptionStyle,
                borderColor: paymentMethod === '간편결제' ? '#4a90e2' : '#ddd',
                backgroundColor: paymentMethod === '간편결제' ? '#f0f7ff' : '#ffffff'
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="간편결제"
                  checked={paymentMethod === '간편결제'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={radioStyle}
                />
                <span>간편결제</span>
              </label>

              <label style={{
                ...paymentOptionStyle,
                borderColor: paymentMethod === '계좌이체' ? '#4a90e2' : '#ddd',
                backgroundColor: paymentMethod === '계좌이체' ? '#f0f7ff' : '#ffffff'
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="계좌이체"
                  checked={paymentMethod === '계좌이체'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={radioStyle}
                />
                <span>계좌이체</span>
              </label>

              <label style={{
                ...paymentOptionStyle,
                borderColor: paymentMethod === '무통장입금' ? '#4a90e2' : '#ddd',
                backgroundColor: paymentMethod === '무통장입금' ? '#f0f7ff' : '#ffffff'
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="무통장입금"
                  checked={paymentMethod === '무통장입금'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={radioStyle}
                />
                <span>무통장입금</span>
              </label>

              <label style={{
                ...paymentOptionStyle,
                borderColor: paymentMethod === '포인트결제' ? '#4a90e2' : '#ddd',
                backgroundColor: paymentMethod === '포인트결제' ? '#f0f7ff' : '#ffffff'
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="포인트결제"
                  checked={paymentMethod === '포인트결제'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={radioStyle}
                />
                <span>포인트결제</span>
              </label>
            </div>

            <div style={termsStyle}>
              <div style={termsLinkStyle}>
                구매 및 결제대행 서비스 이용약관
                <a href="#" style={linkStyle} onClick={(e) => { e.preventDefault(); alert('약관 보기'); }}>
                  - 약관보기
                </a>
              </div>

              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={checkboxStyle}
                />
                <span>위 주문 내용을 확인하였으며 결제에 동의합니다.</span>
              </label>
            </div>
          </div>
        </div>

        {/* 오른쪽: 주문 요약 */}
        <div style={rightSectionStyle}>
          <div style={summaryBoxStyle}>
            <h2 style={summaryTitleStyle}>주문 요약</h2>

            {/* 주문 상품 목록 */}
            <div style={orderItemsStyle}>
              {cart.items.map((item) => (
                <div key={item._id} style={orderItemStyle}>
                  <div style={orderItemImageStyle}>
                    {item.product.listImage ? (
                      <img 
                        src={item.product.listImage} 
                        alt={item.product.name}
                        style={orderItemImageImgStyle}
                      />
                    ) : (
                      <div style={orderItemNoImageStyle}>이미지 없음</div>
                    )}
                  </div>

                  <div style={orderItemInfoStyle}>
                    <div style={orderItemNameStyle}>{item.product.name}</div>
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
                    <div style={orderItemQuantityStyle}>
                      {item.quantity}개
                    </div>
                    <div style={orderItemPriceStyle}>
                      {item.unitPrice.toLocaleString()}원
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 요약 정보 */}
            <div style={summaryInfoStyle}>
              <div style={summaryRowStyle}>
                <span>상품수량 ({cart.totalQuantity}개)</span>
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
            </div>

            {/* 결제하기 버튼 */}
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                ...paymentButtonStyle,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? '처리 중...' : '결제하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 스타일 정의
const containerStyle = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '40px 60px',
  minHeight: '60vh',
  backgroundColor: '#ffffff'
}

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  fontSize: '16px',
  color: '#666'
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '40px',
  paddingBottom: '20px',
  borderBottom: '1px solid #e0e0e0'
}

const pageTitleStyle = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: 0
}

const breadcrumbStyle = {
  fontSize: '14px',
  color: '#999'
}

const breadcrumbActiveStyle = {
  color: '#1a1a1a',
  fontWeight: '600'
}

const contentWrapperStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 400px',
  gap: '40px',
  alignItems: 'start'
}

const leftSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
}

const rightSectionStyle = {
  position: 'sticky',
  top: '20px'
}

const sectionStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '30px'
}

const sectionTitleStyle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const iconStyle = {
  fontSize: '18px'
}

const formGroupStyle = {
  marginBottom: '20px'
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#333',
  marginBottom: '8px'
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
}

const addressInputWrapperStyle = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center'
}

const addressSearchButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#2c3e50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}

const paymentOptionsStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '30px'
}

const paymentOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.2s',
  backgroundColor: '#ffffff'
}

const radioStyle = {
  margin: 0,
  cursor: 'pointer'
}

const termsStyle = {
  marginTop: '20px',
  paddingTop: '20px',
  borderTop: '1px solid #e0e0e0'
}

const termsLinkStyle = {
  fontSize: '13px',
  color: '#666',
  marginBottom: '15px'
}

const linkStyle = {
  color: '#3498db',
  textDecoration: 'none',
  marginLeft: '5px'
}

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#333',
  cursor: 'pointer'
}

const checkboxStyle = {
  margin: 0,
  cursor: 'pointer'
}

const summaryBoxStyle = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '30px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
}

const summaryTitleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  marginBottom: '24px',
  color: '#1a1a1a'
}

const orderItemsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  marginBottom: '30px',
  paddingBottom: '20px',
  borderBottom: '1px solid #ddd'
}

const orderItemStyle = {
  display: 'flex',
  gap: '15px'
}

const orderItemImageStyle = {
  flexShrink: 0
}

const orderItemImageImgStyle = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '4px'
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
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const orderItemNameStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a'
}

const orderItemOptionsStyle = {
  fontSize: '12px',
  color: '#666'
}

const orderItemQuantityStyle = {
  fontSize: '12px',
  color: '#999'
}

const orderItemPriceStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginTop: 'auto'
}

const summaryInfoStyle = {
  marginBottom: '24px'
}

const summaryRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '14px',
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
  alignItems: 'center'
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

const paymentButtonStyle = {
  width: '100%',
  padding: '16px',
  backgroundColor: '#4a90e2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

export default Checkout


import mongoose from 'mongoose';

// 주문 아이템 스키마 (장바구니 아이템과 유사하지만 주문 시점의 정보를 저장)
const orderItemSchema = new mongoose.Schema({
  // 상품 정보
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, '상품 정보는 필수입니다.']
  },
  
  // 주문 시점의 상품 정보 (스냅샷 - 상품 정보가 변경되어도 주문 정보는 유지)
  productSnapshot: {
    sku: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    adminName: {
      type: String
    },
    listImage: {
      type: String
    }
  },
  
  // 선택된 옵션들
  selectedOptions: {
    // 추가 옵션
    customOptions: [{
      optionName: {
        type: String,
        trim: true
      },
      valueName: {
        type: String,
        trim: true
      },
      price: {
        type: Number,
        default: 0
      }
    }],
    
    // 색상 옵션
    color: {
      colorName: {
        type: String,
        trim: true
      },
      price: {
        type: Number,
        default: 0
      }
    },
    
    // 사이즈 옵션
    size: {
      sizeName: {
        type: String,
        trim: true
      },
      price: {
        type: Number,
        default: 0
      }
    }
  },
  
  // 수량
  quantity: {
    type: Number,
    required: [true, '수량은 필수입니다.'],
    min: [1, '수량은 1개 이상이어야 합니다.']
  },
  
  // 단위 가격 (주문 시점의 가격)
  unitPrice: {
    type: Number,
    required: [true, '가격은 필수입니다.'],
    min: [0, '가격은 0보다 커야 합니다.']
  },
  
  // 총 가격 (단위가격 * 수량)
  totalPrice: {
    type: Number,
    required: [true, '총 가격은 필수입니다.'],
    min: [0, '총 가격은 0보다 커야 합니다.']
  }
}, {
  _id: true
});

const orderSchema = new mongoose.Schema({
  // 주문번호 (고유, 자동 생성)
  orderNumber: {
    type: String
  },
  
  // 주문자 정보
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '주문자 정보는 필수입니다.']
  },
  
  // 주문 상태
  orderStatus: {
    type: String,
    required: [true, '주문 상태는 필수입니다.'],
    enum: {
      values: [
        '주문접수',        // 주문이 접수됨
        '결제대기',        // 결제 대기 중
        '결제완료',        // 결제 완료
        '배송준비중',      // 배송 준비 중
        '배송중',          // 배송 중
        '배송완료',        // 배송 완료
        '주문취소',        // 주문 취소
        '부분취소',        // 일부 상품 취소
        '취소요청',        // 취소 요청
        '반품요청',        // 반품 요청
        '반품진행중',      // 반품 진행 중
        '반품완료',        // 반품 완료
        '교환요청',        // 교환 요청
        '교환진행중',      // 교환 진행 중
        '교환완료'         // 교환 완료
      ],
      message: '유효하지 않은 주문 상태입니다.'
    },
    default: '주문접수'
  },
  
  // 주문 상품 목록
  items: [orderItemSchema],
  
  // 결제 정보
  payment: {
    // 결제 방법
    method: {
      type: String,
      enum: {
        values: ['카드결제', '계좌이체', '무통장입금', '간편결제', '포인트결제'],
        message: '유효하지 않은 결제 방법입니다.'
      },
      required: [true, '결제 방법은 필수입니다.']
    },
    
    // 결제 상태
    status: {
      type: String,
      enum: {
        values: ['미결제', '결제대기', '결제완료', '결제실패', '결제취소', '환불완료'],
        message: '유효하지 않은 결제 상태입니다.'
      },
      default: '미결제'
    },
    
    // 결제 금액
    amount: {
      type: Number,
      required: [true, '결제 금액은 필수입니다.'],
      min: [0, '결제 금액은 0보다 커야 합니다.']
    },
    
    // 결제일시
    paidAt: {
      type: Date
    },
    
    // 결제 승인번호 (카드사/은행에서 발급)
    approvalNumber: {
      type: String,
      trim: true
    },
    
    // 결제 거래번호
    transactionId: {
      type: String,
      trim: true
    },
    
    // 포트원 결제 고유번호 (imp_uid)
    impUid: {
      type: String,
      trim: true
    }
  },
  
  // 배송 정보
  delivery: {
    // 수령인 이름
    recipientName: {
      type: String,
      required: [true, '수령인 이름은 필수입니다.'],
      trim: true,
      maxlength: [50, '수령인 이름은 50자 이하여야 합니다.']
    },
    
    // 수령인 전화번호
    recipientPhone: {
      type: String,
      required: [true, '수령인 전화번호는 필수입니다.'],
      trim: true,
      match: [/^[0-9-]+$/, '전화번호는 숫자와 하이픈만 사용 가능합니다.']
    },
    
    // 배송지 주소 (우편번호)
    postalCode: {
      type: String,
      trim: true,
      default: ''
    },
    
    // 배송지 주소 (기본주소)
    address: {
      type: String,
      required: [true, '주소는 필수입니다.'],
      trim: true,
      maxlength: [200, '주소는 200자 이하여야 합니다.']
    },
    
    // 배송지 주소 (상세주소)
    detailAddress: {
      type: String,
      trim: true,
      maxlength: [200, '상세주소는 200자 이하여야 합니다.']
    },
    
    // 배송 요청사항
    deliveryRequest: {
      type: String,
      trim: true,
      maxlength: [500, '배송 요청사항은 500자 이하여야 합니다.']
    },
    
    // 배송비
    shippingFee: {
      type: Number,
      default: 0,
      min: [0, '배송비는 0 이상이어야 합니다.']
    },
    
    // 배송 시작일시
    shippedAt: {
      type: Date
    },
    
    // 배송 완료일시
    deliveredAt: {
      type: Date
    },
    
    // 운송장 번호
    trackingNumber: {
      type: String,
      trim: true
    },
    
    // 택배사
    courier: {
      type: String,
      trim: true,
      maxlength: [50, '택배사명은 50자 이하여야 합니다.']
    }
  },
  
  // 가격 정보
  pricing: {
    // 상품 총액 (모든 상품의 총 가격)
    productsTotal: {
      type: Number,
      required: [true, '상품 총액은 필수입니다.'],
      min: [0, '상품 총액은 0보다 커야 합니다.']
    },
    
    // 할인 금액
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, '할인 금액은 0 이상이어야 합니다.']
    },
    
    // 배송비
    shippingFee: {
      type: Number,
      default: 0,
      min: [0, '배송비는 0 이상이어야 합니다.']
    },
    
    // 최종 결제 금액
    totalAmount: {
      type: Number,
      required: [true, '최종 결제 금액은 필수입니다.'],
      min: [0, '최종 결제 금액은 0보다 커야 합니다.']
    }
  },
  
  // 주문 메모 (고객이 입력)
  orderMemo: {
    type: String,
    trim: true,
    maxlength: [1000, '주문 메모는 1000자 이하여야 합니다.']
  },
  
  // 관리자 메모 (관리자 전용)
  adminMemo: {
    type: String,
    trim: true,
    maxlength: [2000, '관리자 메모는 2000자 이하여야 합니다.']
  },
  
  // 장바구니에서 생성된 주문인지 여부 (구매하기 모드인 경우 false)
  createdFromCart: {
    type: Boolean,
    default: true
  },
  
  // 취소/반품/교환 정보
  cancellation: {
    // 취소 사유
    reason: {
      type: String,
      trim: true,
      maxlength: [500, '취소 사유는 500자 이하여야 합니다.']
    },
    
    // 취소일시
    cancelledAt: {
      type: Date
    },
    
    // 환불 금액
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, '환불 금액은 0 이상이어야 합니다.']
    },
    
    // 환불 계좌 정보
    refundAccount: {
      bank: {
        type: String,
        trim: true
      },
      accountNumber: {
        type: String,
        trim: true
      },
      accountHolder: {
        type: String,
        trim: true
      }
    },
    
    // 환불 완료일시
    refundedAt: {
      type: Date
    }
  },
  
  // 활성화 여부 (삭제 대신 비활성화)
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // createdAt, updatedAt 자동 생성
});

// 주문번호 자동 생성 미들웨어 (validation 전에 실행)
orderSchema.pre('validate', async function(next) {
  if (!this.orderNumber) {
    try {
      // 형식: ORD-YYYYMMDD-XXXXXX (예: ORD-20240101-000001)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // 오늘 날짜로 시작하는 주문번호 개수 조회
      const count = await mongoose.model('Order').countDocuments({
        orderNumber: new RegExp(`^ORD-${dateStr}-`)
      });
      
      // 6자리 순번 (000001 ~ 999999)
      const sequence = String(count + 1).padStart(6, '0');
      this.orderNumber = `ORD-${dateStr}-${sequence}`;
    } catch (error) {
      // 에러 발생 시 타임스탬프 기반 주문번호 생성
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      this.orderNumber = `ORD-${timestamp}-${random}`;
    }
  }
  next();
});

// 인덱스 설정
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true }); // null 값은 인덱스에서 제외
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// 가상 필드: 총 수량
orderSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
});

// toJSON 시 가상 필드 포함
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;


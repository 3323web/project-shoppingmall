import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  // 상품 정보
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, '상품 정보는 필수입니다.']
  },
  
  // 선택된 옵션들
  selectedOptions: {
    // 추가 옵션 (관리자가 설정한 커스텀 옵션)
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
    min: [1, '수량은 1개 이상이어야 합니다.'],
    default: 1
  },
  
  // 단위 가격 (상품 기본가 + 옵션 추가가)
  unitPrice: {
    type: Number,
    required: [true, '가격은 필수입니다.'],
    min: [0, '가격은 0보다 커야 합니다.']
  }
}, {
  _id: true
});

const cartSchema = new mongoose.Schema({
  // 사용자 정보
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '사용자 정보는 필수입니다.']
  },
  
  // 장바구니 아이템들
  items: [cartItemSchema],
  
  // 활성화 여부 (주문 완료 후 비활성화 가능)
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 사용자별 장바구니 조회를 위한 인덱스
cartSchema.index({ user: 1, isActive: 1 });

// 가상 필드: 총 금액
cartSchema.virtual('totalAmount').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.unitPrice * item.quantity);
  }, 0);
});

// 가상 필드: 총 수량
cartSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
});

// toJSON 시 가상 필드 포함
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// 장바구니 아이템 추가 메서드
cartSchema.methods.addItem = function(itemData) {
  // 같은 상품, 같은 옵션 조합이 있는지 확인
  const existingItemIndex = this.items.findIndex(item => {
    if (item.product.toString() !== itemData.product.toString()) {
      return false;
    }
    
    // 옵션 비교
    const customMatch = JSON.stringify(item.selectedOptions.customOptions) === 
                       JSON.stringify(itemData.selectedOptions.customOptions);
    const colorMatch = JSON.stringify(item.selectedOptions.color) === 
                      JSON.stringify(itemData.selectedOptions.color);
    const sizeMatch = JSON.stringify(item.selectedOptions.size) === 
                     JSON.stringify(itemData.selectedOptions.size);
    
    return customMatch && colorMatch && sizeMatch;
  });
  
  if (existingItemIndex > -1) {
    // 기존 아이템의 수량 증가
    this.items[existingItemIndex].quantity += itemData.quantity || 1;
  } else {
    // 새 아이템 추가
    this.items.push(itemData);
  }
  
  return this.save();
};

// 장바구니 아이템 제거 메서드
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  return this.save();
};

// 장바구니 아이템 수량 업데이트 메서드
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.find(item => item._id.toString() === itemId.toString());
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  return this.save();
};

// 장바구니 비우기 메서드
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;


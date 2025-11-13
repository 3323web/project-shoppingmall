import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // 상품코드 (SKU)
  sku: {
    type: String,
    required: [true, '상품코드(SKU)는 필수입니다.'],
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9-]+$/, '상품코드는 영문 대문자, 숫자, 하이픈만 사용 가능합니다.']
  },
  
  // 상품명
  name: {
    type: String,
    required: [true, '상품명은 필수입니다.'],
    trim: true,
    maxlength: [200, '상품명은 200자 이하여야 합니다.']
  },
  
  // 관리자용 상품명
  adminName: {
    type: String,
    required: [true, '관리자용 상품명은 필수입니다.'],
    trim: true,
    maxlength: [200, '관리자용 상품명은 200자 이하여야 합니다.']
  },
  
  // 상품카테고리
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, '카테고리는 필수입니다.']
  },
  
  // 상품상태
  productStatus: {
    type: String,
    required: [true, '상품상태는 필수입니다.'],
    enum: {
      values: ['판매중', '일시품절', '판매종료'],
      message: '상품상태는 판매중, 일시품절, 판매종료 중 하나여야 합니다.'
    },
    default: '판매중'
  },
  
  // 공급업체분류
  supplierType: {
    type: String,
    required: [true, '공급업체분류는 필수입니다.'],
    enum: {
      values: ['상품업체', '인쇄업체', '배송업체', '기타업체'],
      message: '공급업체분류는 상품업체, 인쇄업체, 배송업체, 기타업체 중 하나여야 합니다.'
    }
  },
  
  // 공급업체명
  supplierName: {
    type: String,
    required: [true, '공급업체명은 필수입니다.'],
    trim: true,
    maxlength: [200, '공급업체명은 200자 이하여야 합니다.']
  },
  
  // 시중가격
  marketPrice: {
    type: Number,
    required: [true, '시중가격은 필수입니다.'],
    min: [0, '시중가격은 0보다 커야 합니다.']
  },
  
  // 할인가
  price: {
    type: Number,
    required: [true, '할인가는 필수입니다.'],
    min: [0, '할인가는 0보다 커야 합니다.']
  },
  
  // 공급원가
  costPrice: {
    type: Number,
    required: [true, '공급원가는 필수입니다.'],
    min: [0, '공급원가는 0보다 커야 합니다.']
  },
  
  // 제품소재
  material: {
    type: String,
    trim: true,
    maxlength: [100, '제품소재는 100자 이하여야 합니다.']
  },
  
  // 참고사항
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, '참고사항은 1000자 이하여야 합니다.']
  },
  
  // 상품순서
  sortOrder: {
    type: Number,
    default: 1,
    min: [1, '상품순서는 1 이상이어야 합니다.']
  },
  
  // 상세설명
  description: {
    type: String,
    trim: true,
    maxlength: [10000, '상세설명은 10000자 이하여야 합니다.']
  },
  
  // 목록이미지
  listImage: {
    type: String,
    trim: true
  },
  
  // 상세이미지 (배열)
  detailImages: [{
    type: String
  }],
  
  // 색상 옵션
  colorOptions: [{
    optionOrder: {
      type: Number,
      required: [true, '옵션순서는 필수입니다.'],
      min: [1, '옵션순서는 1 이상이어야 합니다.']
    },
    colorName: {
      type: String,
      required: [true, '색상명은 필수입니다.'],
      trim: true,
      maxlength: [50, '색상명은 50자 이하여야 합니다.']
    },
    costPrice: {
      type: Number,
      required: [true, '옵션원가는 필수입니다.']
    },
    price: {
      type: Number,
      required: [true, '옵션판매가는 필수입니다.']
    }
  }],
  
  // 사이즈 옵션
  sizeOptions: [{
    optionOrder: {
      type: Number,
      required: [true, '옵션순서는 필수입니다.'],
      min: [1, '옵션순서는 1 이상이어야 합니다.']
    },
    sizeName: {
      type: String,
      required: [true, '사이즈명은 필수입니다.'],
      trim: true,
      maxlength: [20, '사이즈명은 20자 이하여야 합니다.']
    },
    costPrice: {
      type: Number,
      required: [true, '옵션원가는 필수입니다.']
    },
    price: {
      type: Number,
      required: [true, '옵션판매가는 필수입니다.']
    }
  }],
  
  // 추가 옵션 (관리자가 자유롭게 설정)
  customOptions: [{
    optionName: {
      type: String,
      required: [true, '옵션명은 필수입니다.'],
      trim: true,
      maxlength: [50, '옵션명은 50자 이하여야 합니다.']
    },
    optionValues: [{
      optionOrder: {
        type: Number,
        required: [true, '옵션순서는 필수입니다.'],
        min: [1, '옵션순서는 1 이상이어야 합니다.']
      },
      valueName: {
        type: String,
        required: [true, '옵션값은 필수입니다.'],
        trim: true,
        maxlength: [100, '옵션값은 100자 이하여야 합니다.']
      },
      costPrice: {
        type: Number,
        required: [true, '옵션원가는 필수입니다.']
      },
      price: {
        type: Number,
        required: [true, '옵션판매가는 필수입니다.']
      }
    }]
  }],
  
  // 재고
  stock: {
    type: Number,
    default: 0,
    min: [0, '재고는 0보다 작을 수 없습니다.']
  },
  
  // 활성화 여부
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// SKU 인덱스
productSchema.index({ sku: 1 }, { unique: true });

// 공급업체명 인덱스 (검색 성능 향상용)
productSchema.index({ supplierName: 1 });

// 카테고리 및 정렬 순서 인덱스
productSchema.index({ category: 1, sortOrder: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;



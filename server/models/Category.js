import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '카테고리명은 필수입니다.'],
    trim: true,
    maxlength: [100, '카테고리명은 100자 이하여야 합니다.']
  },
  slug: {
    type: String,
    required: [true, '슬러그는 필수입니다.'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^[a-z0-9-]+$/, '슬러그는 영문 소문자, 숫자, 하이픈만 사용 가능합니다.']
  },
  parentCategory: {
    type: String,
    required: [true, '1차 카테고리는 필수입니다.'],
    enum: {
      values: ['MAN', 'WOMAN', 'KIDS', 'ACCESSORIES'],
      message: '1차 카테고리는 MAN, WOMAN, KIDS, ACCESSORIES 중 하나여야 합니다.'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '설명은 500자 이하여야 합니다.']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 슬러그와 부모 카테고리 조합으로 인덱스 생성
categorySchema.index({ slug: 1, parentCategory: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;


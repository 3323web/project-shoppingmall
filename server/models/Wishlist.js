import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  // 사용자 정보
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '사용자 정보는 필수입니다.']
  },
  
  // 상품 정보
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, '상품 정보는 필수입니다.']
  }
}, {
  timestamps: true
});

// 한 사용자가 같은 상품을 중복으로 위시리스트에 담을 수 없도록 복합 인덱스 설정
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

// 사용자별 위시리스트 조회를 위한 인덱스
wishlistSchema.index({ user: 1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;


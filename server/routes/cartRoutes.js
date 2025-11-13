import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  addBulkItemsToCart
} from '../controllers/cartController.js';

const router = express.Router();

// 사용자의 장바구니 조회 (로그인 필요)
router.get('/cart', authenticate, getCart);

// 장바구니에 상품 추가 (로그인 필요)
router.post('/cart/items', authenticate, addItemToCart);

// 여러 아이템을 한번에 장바구니에 추가 (로그인 필요)
router.post('/cart/items/bulk', authenticate, addBulkItemsToCart);

// 장바구니 아이템 수량 변경 (로그인 필요)
router.put('/cart/items/:itemId', authenticate, updateCartItemQuantity);

// 장바구니 아이템 제거 (로그인 필요)
router.delete('/cart/items/:itemId', authenticate, removeCartItem);

// 장바구니 비우기 (로그인 필요)
router.delete('/cart', authenticate, clearCart);

export default router;

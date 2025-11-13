import express from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth.js';
import {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updatePayment,
  updateDelivery,
  cancelOrder,
  deleteOrder,
  getOrderStats,
  getCategoryRevenueStats,
  getMonthlyOrderStats
} from '../controllers/orderController.js';

const router = express.Router();

// 주문 생성 (로그인 필요)
router.post('/orders', authenticate, createOrder);

// 주문 통계 조회 (관리자 전용)
router.get('/orders/stats', authenticate, authorizeAdmin, getOrderStats);

// 이번달 거래 현황 조회 (관리자 전용)
router.get('/orders/stats/monthly', authenticate, authorizeAdmin, getMonthlyOrderStats);

// 카테고리별 매출 통계 조회 (관리자 전용)
router.get('/orders/stats/category-revenue', authenticate, authorizeAdmin, getCategoryRevenueStats);

// 전체 주문 목록 조회 (관리자 전용)
router.get('/orders', authenticate, authorizeAdmin, getAllOrders);

// 사용자별 주문 목록 조회 (로그인 필요)
router.get('/orders/my', authenticate, getUserOrders);

// 특정 주문 조회 (로그인 필요)
router.get('/orders/:id', authenticate, getOrderById);

// 주문 상태 변경 (관리자 전용)
router.put('/orders/:id/status', authenticate, authorizeAdmin, updateOrderStatus);

// 결제 정보 업데이트 (로그인 필요 - 결제 완료 후 사용자도 호출 가능)
router.put('/orders/:id/payment', authenticate, updatePayment);

// 배송 정보 업데이트 (관리자 전용)
router.put('/orders/:id/delivery', authenticate, authorizeAdmin, updateDelivery);

// 주문 취소 (로그인 필요)
router.put('/orders/:id/cancel', authenticate, cancelOrder);

// 주문 삭제 (관리자 전용)
router.delete('/orders/:id', authenticate, authorizeAdmin, deleteOrder);

export default router;


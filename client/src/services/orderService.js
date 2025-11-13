import api from '../utils/api';

export const orderService = {
  // 주문 생성
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 전체 주문 목록 조회 (관리자)
  getAllOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 사용자별 주문 목록 조회
  getUserOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders/my', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 특정 주문 조회
  getOrderById: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 주문 상태 변경 (관리자)
  updateOrderStatus: async (id, statusData) => {
    try {
      const response = await api.put(`/orders/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 결제 정보 업데이트 (관리자)
  updatePayment: async (id, paymentData) => {
    try {
      const response = await api.put(`/orders/${id}/payment`, paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 배송 정보 업데이트 (관리자)
  updateDelivery: async (id, deliveryData) => {
    try {
      const response = await api.put(`/orders/${id}/delivery`, deliveryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 주문 취소
  cancelOrder: async (id, cancelData) => {
    try {
      const response = await api.put(`/orders/${id}/cancel`, cancelData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 주문 삭제 (관리자)
  deleteOrder: async (id) => {
    try {
      const response = await api.delete(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 주문 통계 조회 (관리자)
  getOrderStats: async (params = {}) => {
    try {
      const response = await api.get('/orders/stats', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 카테고리별 매출 통계 조회 (관리자)
  getCategoryRevenueStats: async (period = '1year') => {
    try {
      const response = await api.get('/orders/stats/category-revenue', { params: { period } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 이번달 거래 현황 조회 (관리자)
  getMonthlyOrderStats: async () => {
    try {
      const response = await api.get('/orders/stats/monthly');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default orderService;


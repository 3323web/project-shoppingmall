import api from '../utils/api';

export const cartService = {
  // 장바구니 조회
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 장바구니에 상품 추가
  addItemToCart: async (itemData) => {
    try {
      const response = await api.post('/cart/items', itemData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 여러 아이템 일괄 추가
  addBulkItemsToCart: async (items) => {
    try {
      const response = await api.post('/cart/items/bulk', { items });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 장바구니 아이템 수량 변경
  updateCartItemQuantity: async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/items/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 장바구니 아이템 제거
  removeCartItem: async (itemId) => {
    try {
      const response = await api.delete(`/cart/items/${itemId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 장바구니 비우기
  clearCart: async () => {
    try {
      const response = await api.delete('/cart');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default cartService;


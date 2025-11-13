import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// 사용자의 장바구니 조회
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ 
      user: req.user.id, 
      isActive: true 
    }).populate({
      path: 'items.product',
      select: 'sku name price marketPrice listImage productStatus colorOptions sizeOptions customOptions'
    });

    // 장바구니가 없으면 새로 생성
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: []
      });
      await cart.save();
    }

    // toObject()를 사용하여 가상 필드 포함
    const cartObject = cart.toObject({ virtuals: true });

    res.json({
      success: true,
      data: cartObject
    });
  } catch (error) {
    console.error('장바구니 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니에 상품 추가
export const addItemToCart = async (req, res) => {
  try {
    const { productId, selectedOptions, quantity, unitPrice } = req.body;

    // 유효성 검사
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID는 필수입니다.'
      });
    }

    if (!unitPrice || unitPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: '올바른 가격을 입력해주세요.'
      });
    }

    // 상품 존재 여부 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    // 상품 판매 상태 확인
    if (product.productStatus === '판매종료') {
      return res.status(400).json({
        success: false,
        message: '판매 종료된 상품입니다.'
      });
    }

    // 사용자의 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ 
      user: req.user.id, 
      isActive: true 
    });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: []
      });
    }

    // 장바구니 아이템 추가
    await cart.addItem({
      product: productId,
      selectedOptions: selectedOptions || {
        customOptions: [],
        color: {},
        size: {}
      },
      quantity: quantity || 1,
      unitPrice: unitPrice
    });

    // 최신 데이터로 다시 조회 (populate 포함)
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'sku name price marketPrice listImage productStatus'
    });

    // toObject()를 사용하여 가상 필드 포함
    const cartObject = cart.toObject({ virtuals: true });

    res.status(201).json({
      success: true,
      message: '장바구니에 추가되었습니다.',
      data: cartObject
    });
  } catch (error) {
    console.error('장바구니 추가 에러:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 추가 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니 아이템 수량 변경
export const updateCartItemQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '수량은 1개 이상이어야 합니다.'
      });
    }

    const cart = await Cart.findOne({ 
      user: req.user.id, 
      isActive: true 
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.'
      });
    }

    await cart.updateItemQuantity(itemId, quantity);

    // 최신 데이터로 다시 조회
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'sku name price marketPrice listImage productStatus'
    });

    // toObject()를 사용하여 가상 필드 포함
    const cartObject = updatedCart.toObject({ virtuals: true });

    res.json({
      success: true,
      message: '수량이 변경되었습니다.',
      data: cartObject
    });
  } catch (error) {
    console.error('장바구니 수량 변경 에러:', error);
    res.status(500).json({
      success: false,
      message: '수량 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니 아이템 제거
export const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ 
      user: req.user.id, 
      isActive: true 
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.'
      });
    }

    await cart.removeItem(itemId);

    // 최신 데이터로 다시 조회
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'sku name price marketPrice listImage productStatus'
    });

    // toObject()를 사용하여 가상 필드 포함
    const cartObject = updatedCart.toObject({ virtuals: true });

    res.json({
      success: true,
      message: '장바구니에서 제거되었습니다.',
      data: cartObject
    });
  } catch (error) {
    console.error('장바구니 아이템 제거 에러:', error);
    res.status(500).json({
      success: false,
      message: '아이템 제거 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니 비우기
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ 
      user: req.user.id, 
      isActive: true 
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.'
      });
    }

    await cart.clearCart();

    // toObject()를 사용하여 가상 필드 포함
    const cartObject = cart.toObject({ virtuals: true });

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다.',
      data: cartObject
    });
  } catch (error) {
    console.error('장바구니 비우기 에러:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 비우기 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 여러 아이템을 한번에 장바구니에 추가
export const addBulkItemsToCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '추가할 상품 정보가 필요합니다.'
      });
    }

    // 사용자의 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ 
      user: req.user.id, 
      isActive: true 
    });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: []
      });
    }

    // 각 아이템 검증 및 추가
    for (const item of items) {
      const { productId, selectedOptions, quantity, unitPrice } = item;

      // 상품 존재 여부 확인
      const product = await Product.findById(productId);
      if (!product || product.productStatus === '판매종료') {
        continue; // 판매 불가능한 상품은 스킵
      }

      await cart.addItem({
        product: productId,
        selectedOptions: selectedOptions || {
          customOptions: [],
          color: {},
          size: {}
        },
        quantity: quantity || 1,
        unitPrice: unitPrice
      });
    }

    // 최신 데이터로 다시 조회
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'sku name price marketPrice listImage productStatus'
    });

    // toObject()를 사용하여 가상 필드 포함
    const cartObject = cart.toObject({ virtuals: true });

    res.status(201).json({
      success: true,
      message: '장바구니에 추가되었습니다.',
      data: cartObject
    });
  } catch (error) {
    console.error('장바구니 일괄 추가 에러:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 추가 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};


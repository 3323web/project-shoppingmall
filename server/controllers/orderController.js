import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import axios from 'axios';

/**
 * 포트원 결제 검증 함수 (서버사이드)
 * 실제 포트원 API를 호출하여 결제를 검증합니다.
 * 
 * @param {string} impUid - 포트원 결제 고유번호
 * @param {number} amount - 결제 금액
 * @returns {Promise<Object>} 결제 검증 결과
 */

const verifyPortOnePayment = async (impUid, amount) => {
  try {
    const PORTONE_REST_API_KEY = process.env.PORTONE_REST_API_KEY;
    const PORTONE_REST_API_SECRET = process.env.PORTONE_REST_API_SECRET;

    if (!PORTONE_REST_API_KEY || !PORTONE_REST_API_SECRET) {
      throw new Error('포트원 API 키가 설정되지 않았습니다.');
    }

    // 포트원 Access Token 발급
    const tokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: PORTONE_REST_API_KEY,
      imp_secret: PORTONE_REST_API_SECRET
    });

    const accessToken = tokenResponse.data.response.access_token;

    // 결제 정보 조회
    const paymentResponse = await axios.get(
      `https://api.iamport.kr/payments/${impUid}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const paymentData = paymentResponse.data.response;

    // 결제 상태 확인
    if (paymentData.status !== 'paid') {
      return {
        success: false,
        message: '결제가 완료되지 않았습니다.',
        status: paymentData.status
      };
    }

    // 결제 금액 확인
    if (paymentData.amount !== amount) {
      return {
        success: false,
        message: `결제 금액이 일치하지 않습니다. (결제금액: ${paymentData.amount}, 주문금액: ${amount})`,
        paidAmount: paymentData.amount,
        orderAmount: amount
      };
    }

    return {
      success: true,
      paymentData: {
        impUid: paymentData.imp_uid,
        merchantUid: paymentData.merchant_uid,
        amount: paymentData.amount,
        status: paymentData.status,
        paidAt: paymentData.paid_at,
        payMethod: paymentData.pay_method,
        applyNum: paymentData.apply_num
      }
    };
  } catch (error) {
    console.error('포트원 결제 검증 실패:', error);
    return {
      success: false,
      message: '결제 검증 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * 포트원 결제 취소 함수 (서버사이드)
 * 실제 포트원 API를 호출하여 결제를 취소합니다.
 * 
 * @param {string} impUid - 포트원 결제 고유번호
 * @param {number} amount - 취소 금액 (전액 취소 시 주문 금액)
 * @param {string} reason - 취소 사유
 * @returns {Promise<Object>} 결제 취소 결과
 */
const cancelPortOnePayment = async (impUid, amount, reason = '고객 요청') => {
  try {
    const PORTONE_REST_API_KEY = process.env.PORTONE_REST_API_KEY;
    const PORTONE_REST_API_SECRET = process.env.PORTONE_REST_API_SECRET;

    if (!PORTONE_REST_API_KEY || !PORTONE_REST_API_SECRET) {
      throw new Error('포트원 API 키가 설정되지 않았습니다.');
    }

    // 포트원 Access Token 발급
    const tokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: PORTONE_REST_API_KEY,
      imp_secret: PORTONE_REST_API_SECRET
    });

    const accessToken = tokenResponse.data.response.access_token;

    // 결제 취소 요청
    const cancelResponse = await axios.post(
      'https://api.iamport.kr/payments/cancel',
      {
        imp_uid: impUid,
        amount: amount,
        reason: reason,
        checksum: null // 부분 취소가 아닌 경우 null
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const cancelData = cancelResponse.data.response;

    return {
      success: true,
      cancelData: {
        impUid: cancelData.imp_uid,
        merchantUid: cancelData.merchant_uid,
        cancelAmount: cancelData.cancel_amount,
        cancelReason: cancelData.cancel_reason,
        cancelledAt: cancelData.cancelled_at
      }
    };
  } catch (error) {
    console.error('포트원 결제 취소 실패:', error);
    return {
      success: false,
      message: error.response?.data?.message || '결제 취소 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

// 주문 생성 (장바구니에서 주문하기 또는 직접 아이템으로 주문하기)
export const createOrder = async (req, res) => {
  try {
    const { delivery, payment, orderMemo, items } = req.body;

    // 필수 필드 검증
    if (!delivery || !delivery.recipientName || !delivery.recipientPhone || !delivery.address) {
      return res.status(400).json({
        success: false,
        message: '배송 정보는 필수입니다.'
      });
    }

    if (!payment || !payment.method) {
      return res.status(400).json({
        success: false,
        message: '결제 방법은 필수입니다.'
      });
    }

    let cartItems = [];
    let productIds = [];

    // items가 제공된 경우 (구매하기 모드) - 장바구니를 사용하지 않음
    if (items && Array.isArray(items) && items.length > 0) {
      // 직접 전달된 아이템 사용
      for (const item of items) {
        // 상품 조회 및 검증
        const product = await Product.findById(item.productId);
        
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `상품을 찾을 수 없습니다. (ID: ${item.productId})`
          });
        }

        if (product.productStatus === '판매종료') {
          return res.status(400).json({
            success: false,
            message: `판매 종료된 상품이 포함되어 있습니다: ${product.name}`
          });
        }

        cartItems.push({
          product: product,
          selectedOptions: item.selectedOptions || {},
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });

        productIds.push(product._id.toString());
      }
    } else {
      // items가 없는 경우 - 기존 방식대로 장바구니 사용
      const cart = await Cart.findOne({
        user: req.user.id,
        isActive: true
      }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: '장바구니가 비어있습니다.'
        });
      }

      cartItems = cart.items;
      productIds = cart.items.map(item => item.product._id.toString()).sort();
    }

    // 주문 아이템 생성 및 검증
    const orderItems = [];
    let productsTotal = 0;

    for (const cartItem of cartItems) {
      const product = cartItem.product;

      // 상품 존재 및 판매 가능 여부 확인
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `상품을 찾을 수 없습니다. (ID: ${cartItem.product})`
        });
      }

      if (product.productStatus === '판매종료') {
        return res.status(400).json({
          success: false,
          message: `판매 종료된 상품이 포함되어 있습니다: ${product.name}`
        });
      }

      // 상품 스냅샷 생성
      const productSnapshot = {
        sku: product.sku,
        name: product.name,
        adminName: product.adminName,
        listImage: product.listImage
      };

      const totalPrice = cartItem.unitPrice * cartItem.quantity;
      productsTotal += totalPrice;

      orderItems.push({
        product: product._id,
        productSnapshot,
        selectedOptions: cartItem.selectedOptions,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice
      });
    }

    // 가격 계산
    const shippingFee = delivery.shippingFee || 0;
    const discountAmount = 0; // 할인 기능은 추후 구현
    const totalAmount = productsTotal - discountAmount + shippingFee;

    // 결제 검증
    if (payment.transactionId || payment.merchantUid) {
      // 동일한 거래번호(merchant_uid)로 이미 주문이 생성되었는지 확인
      const transactionId = payment.transactionId || payment.merchantUid;
      const existingOrder = await Order.findOne({
        $or: [
          { 'payment.transactionId': transactionId },
          { orderNumber: transactionId }
        ]
      });

      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: '이미 처리된 결제입니다. 중복 주문을 방지했습니다.',
          existingOrderId: existingOrder._id
        });
      }
    }

    // 포트원 결제 검증 (imp_uid가 있는 경우)
    if (payment.impUid) {
      const verificationResult = await verifyPortOnePayment(payment.impUid, totalAmount);
      
      if (!verificationResult.success) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message,
          ...verificationResult
        });
      }

      // 검증된 결제 정보로 업데이트
      payment.approvalNumber = verificationResult.paymentData.applyNum;
      payment.transactionId = verificationResult.paymentData.merchantUid;
    }

    // 결제 금액 검증
    if (payment.amount && payment.amount !== totalAmount) {
      return res.status(400).json({
        success: false,
        message: `결제 금액이 일치하지 않습니다. (결제금액: ${payment.amount}, 주문금액: ${totalAmount})`,
        paidAmount: payment.amount,
        orderAmount: totalAmount
      });
    }

    // 주문 중복 체크 (같은 사용자가 5분 이내 동일한 상품으로 주문하는 경우)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // 상품 ID 배열 정렬
    productIds.sort();
    
    // 최근 주문 중 동일한 상품 조합이 있는지 확인
    const recentOrders = await Order.find({
      user: req.user.id,
      createdAt: { $gte: fiveMinutesAgo },
      orderStatus: { $in: ['주문접수', '결제대기', '결제완료'] }
    }).populate('items.product');

    for (const recentOrder of recentOrders) {
      const recentProductIds = recentOrder.items
        .map(item => item.product._id.toString())
        .sort();
      
      // 상품 ID 배열이 동일한지 확인
      if (JSON.stringify(productIds) === JSON.stringify(recentProductIds)) {
        // 수량까지 동일한지 확인
        const quantitiesMatch = cartItems.every(cartItem => {
          const orderItem = recentOrder.items.find(
            item => item.product._id.toString() === cartItem.product._id.toString()
          );
          return orderItem && orderItem.quantity === cartItem.quantity;
        });

        if (quantitiesMatch) {
          return res.status(400).json({
            success: false,
            message: '최근 동일한 주문이 있습니다. 잠시 후 다시 시도해주세요.',
            duplicateOrderId: recentOrder._id
          });
        }
      }
    }

    // 주문 생성
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      orderStatus: '주문접수',
      createdFromCart: !items, // items가 제공되지 않은 경우(장바구니 사용)에만 true
      payment: {
        method: payment.method,
        status: payment.method === '무통장입금' ? '결제대기' : '미결제',
        amount: totalAmount,
        ...(payment.approvalNumber && { approvalNumber: payment.approvalNumber }),
        ...(payment.transactionId && { transactionId: payment.transactionId })
      },
      delivery: {
        recipientName: delivery.recipientName,
        recipientPhone: delivery.recipientPhone,
        postalCode: delivery.postalCode || '',
        address: delivery.address,
        detailAddress: delivery.detailAddress || '',
        deliveryRequest: delivery.deliveryRequest || '',
        shippingFee
      },
      pricing: {
        productsTotal,
        discountAmount,
        shippingFee,
        totalAmount
      },
      orderMemo: orderMemo || ''
    });

    await order.save();

    // items가 제공되지 않은 경우(장바구니 사용)에만 장바구니 비우기
    // 무통장입금의 경우에만 장바구니 비우기 (결제 완료된 경우)
    // 포트원 결제의 경우 결제 성공 후 장바구니를 비워야 하므로 여기서는 비우지 않음
    // 구매하기 모드(items 제공)인 경우 장바구니는 그대로 유지
    if (!items && payment.method === '무통장입금') {
      const cart = await Cart.findOne({
        user: req.user.id,
        isActive: true
      });
      
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    }

    // 주문 정보와 함께 반환
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'sku name listImage');

    res.status(201).json({
      success: true,
      message: '주문이 접수되었습니다.',
      data: populatedOrder
    });
  } catch (error) {
    console.error('주문 생성 에러:', error);
    
    // 중복 주문번호 에러 처리
    if (error.code === 11000 && error.keyPattern?.orderNumber) {
      return res.status(400).json({
        success: false,
        message: '주문번호가 중복되었습니다. 다시 시도해주세요.',
        error: 'DUPLICATE_ORDER_NUMBER'
      });
    }

    res.status(500).json({
      success: false,
      message: '주문 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 목록 조회 (관리자용 - 모든 주문)
export const getAllOrders = async (req, res) => {
  try {
    const {
      orderStatus,
      paymentStatus,
      startDate,
      endDate,
      shippedStartDate,
      shippedEndDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isActive: true };

    // 필터 조건
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      filter['payment.status'] = paymentStatus;
    }

    // 주문일 필터
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateObj;
      }
    }

    // 발송일 필터
    if (shippedStartDate || shippedEndDate) {
      filter['delivery.shippedAt'] = {};
      if (shippedStartDate) {
        filter['delivery.shippedAt'].$gte = new Date(shippedStartDate);
      }
      if (shippedEndDate) {
        const endDateObj = new Date(shippedEndDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter['delivery.shippedAt'].$lte = endDateObj;
      }
    }

    // 페이지네이션
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 정렬 설정
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortField] = sortDirection;

    // 주문 조회
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'sku name listImage')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // 전체 개수
    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: orders
    });
  } catch (error) {
    console.error('주문 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 사용자별 주문 목록 조회
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      orderStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { user: userId, isActive: true };

    // 주문 상태 필터
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    } else {
      // 기본적으로 취소/반품/교환 완료된 주문 제외 (주문내역 탭용)
      filter.orderStatus = { 
        $nin: ['주문취소', '반품완료', '교환완료'] 
      };
    }

    // 날짜 필터
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // endDate의 끝까지 포함하기 위해 하루 더 추가
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateObj;
      }
    }

    // 페이지네이션
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 주문 조회
    const orders = await Order.find(filter)
      .populate('items.product', 'sku name listImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 전체 개수
    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: orders
    });
  } catch (error) {
    console.error('사용자 주문 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 특정 주문 조회
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.user_type === 'admin';

    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('items.product', 'sku name listImage productStatus');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 본인 주문이거나 관리자인지 확인
    if (!isAdmin && order.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '주문 조회 권한이 없습니다.'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('주문 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '주문 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 상태 변경 (관리자 전용)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, adminMemo } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: '주문 상태는 필수입니다.'
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 주문 상태 업데이트
    order.orderStatus = orderStatus;

    // 상태별 날짜 업데이트
    if (orderStatus === '배송중' && !order.delivery.shippedAt) {
      order.delivery.shippedAt = new Date();
    }

    if (orderStatus === '배송완료' && !order.delivery.deliveredAt) {
      order.delivery.deliveredAt = new Date();
    }

    if (orderStatus === '주문취소' && !order.cancellation.cancelledAt) {
      order.cancellation.cancelledAt = new Date();
    }

    // 관리자 메모 업데이트
    if (adminMemo) {
      order.adminMemo = adminMemo;
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'sku name listImage');

    res.json({
      success: true,
      message: '주문 상태가 변경되었습니다.',
      data: updatedOrder
    });
  } catch (error) {
    console.error('주문 상태 변경 에러:', error);
    res.status(500).json({
      success: false,
      message: '주문 상태 변경 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 결제 정보 업데이트
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, approvalNumber, transactionId, impUid, paidAt } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.user_type === 'admin';

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 본인 주문이거나 관리자인지 확인
    if (!isAdmin && order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '결제 정보 업데이트 권한이 없습니다.'
      });
    }

    // 포트원 결제 검증 (imp_uid가 있는 경우)
    if (impUid && paymentStatus === '결제완료') {
      const verificationResult = await verifyPortOnePayment(impUid, order.pricing.totalAmount);
      
      if (!verificationResult.success) {
        return res.status(400).json({
          success: false,
          message: verificationResult.message,
          ...verificationResult
        });
      }

      // 검증된 결제 정보로 업데이트
      if (verificationResult.paymentData) {
        order.payment.approvalNumber = verificationResult.paymentData.applyNum || approvalNumber;
        order.payment.transactionId = verificationResult.paymentData.merchantUid || transactionId;
        order.payment.impUid = impUid; // impUid 저장
      }
    } else if (impUid) {
      // impUid만 전달된 경우 저장
      order.payment.impUid = impUid;
    }

    // 결제 상태 업데이트
    if (paymentStatus) {
      order.payment.status = paymentStatus;
    }

    if (approvalNumber && !order.payment.approvalNumber) {
      order.payment.approvalNumber = approvalNumber;
    }

    if (transactionId && !order.payment.transactionId) {
      order.payment.transactionId = transactionId;
    }

    // 결제 완료 시
    if (paymentStatus === '결제완료' && !order.payment.paidAt) {
      order.payment.paidAt = paidAt ? new Date(paidAt) : new Date();
      order.orderStatus = '결제완료';
      
      // 장바구니에서 생성된 주문인 경우에만 장바구니 비우기
      // 구매하기 모드(createdFromCart: false)인 경우 장바구니는 그대로 유지
      if (order.createdFromCart !== false) {
        const cart = await Cart.findOne({
          user: order.user,
          isActive: true
        });
        
        if (cart) {
          await cart.clearCart();
        }
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'sku name listImage');

    res.json({
      success: true,
      message: '결제 정보가 업데이트되었습니다.',
      data: updatedOrder
    });
  } catch (error) {
    console.error('결제 정보 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '결제 정보 업데이트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 배송 정보 업데이트 (관리자 전용)
export const updateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, courier } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 배송 정보 업데이트
    if (trackingNumber) {
      order.delivery.trackingNumber = trackingNumber;
    }

    if (courier) {
      order.delivery.courier = courier;
    }

    // 운송장 번호가 입력되면 배송준비중으로 상태 변경
    if (trackingNumber && order.orderStatus === '결제완료') {
      order.orderStatus = '배송준비중';
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'sku name listImage');

    res.json({
      success: true,
      message: '배송 정보가 업데이트되었습니다.',
      data: updatedOrder
    });
  } catch (error) {
    console.error('배송 정보 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '배송 정보 업데이트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 취소
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundAccount } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.user_type === 'admin';

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 본인 주문이거나 관리자인지 확인
    if (!isAdmin && order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '주문 취소 권한이 없습니다.'
      });
    }

    // 취소 가능한 상태인지 확인
    const cancellableStatuses = ['주문접수', '결제대기', '결제완료', '배송준비중'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `현재 상태에서는 주문을 취소할 수 없습니다. (현재 상태: ${order.orderStatus})`
      });
    }

    // 카드결제(포트원)인 경우 포트원 API를 통해 실제 결제 취소 처리
    if (order.payment.method === '카드결제' && 
        order.payment.status === '결제완료' && 
        order.payment.impUid) {
      
      const cancelResult = await cancelPortOnePayment(
        order.payment.impUid,
        order.pricing.totalAmount,
        reason || '고객 요청'
      );

      if (!cancelResult.success) {
        return res.status(400).json({
          success: false,
          message: `결제 취소에 실패했습니다: ${cancelResult.message}`,
          error: cancelResult.error
        });
      }

      console.log('포트원 결제 취소 완료:', cancelResult.cancelData);
    }

    // 주문 취소 처리
    order.orderStatus = '주문취소';
    order.cancellation.reason = reason || '';
    order.cancellation.cancelledAt = new Date();
    order.cancellation.refundAmount = order.pricing.totalAmount;

    if (refundAccount) {
      order.cancellation.refundAccount = refundAccount;
    }

    // 결제 상태도 취소로 변경
    if (order.payment.status === '결제완료') {
      order.payment.status = '결제취소';
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'sku name listImage');

    res.json({
      success: true,
      message: '주문이 취소되었습니다.',
      data: updatedOrder
    });
  } catch (error) {
    console.error('주문 취소 에러:', error);
    res.status(500).json({
      success: false,
      message: '주문 취소 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 삭제 (비활성화)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 실제 삭제 대신 비활성화
    order.isActive = false;
    await order.save();

    res.json({
      success: true,
      message: '주문이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('주문 삭제 에러:', error);
    res.status(500).json({
      success: false,
      message: '주문 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 통계 조회 (관리자 전용)
export const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { isActive: true };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // 상태별 주문 개수
    const statusCounts = {
      주문접수: await Order.countDocuments({ ...filter, orderStatus: '주문접수' }),
      결제완료: await Order.countDocuments({ ...filter, orderStatus: '결제완료' }),
      배송준비중: await Order.countDocuments({ ...filter, orderStatus: '배송준비중' }),
      배송중: await Order.countDocuments({ ...filter, orderStatus: '배송중' }),
      배송완료: await Order.countDocuments({ ...filter, orderStatus: '배송완료' }),
      주문취소: await Order.countDocuments({ ...filter, orderStatus: '주문취소' }),
      취소요청: await Order.countDocuments({ ...filter, orderStatus: '취소요청' }),
      반품요청: await Order.countDocuments({ ...filter, orderStatus: '반품요청' }),
      교환요청: await Order.countDocuments({ ...filter, orderStatus: '교환요청' }),
      반품진행중: await Order.countDocuments({ ...filter, orderStatus: '반품진행중' }),
      교환진행중: await Order.countDocuments({ ...filter, orderStatus: '교환진행중' })
    };

    // 총 주문 수
    const totalOrders = await Order.countDocuments(filter);

    // 총 매출액 (결제완료된 주문만)
    const completedOrders = await Order.find({
      ...filter,
      'payment.status': '결제완료'
    });

    const totalRevenue = completedOrders.reduce((sum, order) => {
      return sum + order.pricing.totalAmount;
    }, 0);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        statusCounts
      }
    });
  } catch (error) {
    console.error('주문 통계 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '주문 통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 이번달 거래 현황 조회 (관리자 전용)
export const getMonthlyOrderStats = async (req, res) => {
  try {
    // 이번달 시작일과 종료일 계산
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const filter = {
      isActive: true,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    };

    // 총 주문건수 (이번달 생성된 모든 주문)
    const totalOrders = await Order.countDocuments(filter);

    // 취소건수 (취소요청 + 주문취소 + 반품요청 + 반품진행중 + 반품완료)
    const cancelledOrders = await Order.countDocuments({
      ...filter,
      orderStatus: {
        $in: ['취소요청', '주문취소', '반품요청', '반품진행중', '반품완료']
      }
    });

    // 주문확정율 계산
    const confirmationRate = totalOrders > 0 
      ? Math.round(((totalOrders - cancelledOrders) / totalOrders) * 100) 
      : 0;

    // 총 매출액 (이번달 결제완료된 주문의 총액)
    const completedOrders = await Order.find({
      ...filter,
      'payment.status': '결제완료'
    });

    const totalRevenue = completedOrders.reduce((sum, order) => {
      return sum + order.pricing.totalAmount;
    }, 0);

    res.json({
      success: true,
      data: {
        totalOrders,
        cancelledOrders,
        confirmationRate,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('이번달 거래 현황 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '이번달 거래 현황 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 카테고리별 매출 통계 조회 (관리자 전용)
export const getCategoryRevenueStats = async (req, res) => {
  try {
    const { period = '1year' } = req.query; // '1year' 또는 'all'

    const filter = { 
      isActive: true,
      'payment.status': '결제완료' // 결제완료된 주문만
    };

    // 기간 필터 설정
    if (period === '1year') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      filter.createdAt = { $gte: oneYearAgo };
    }
    // period === 'all'인 경우 날짜 필터 없음

    // 결제완료된 주문 조회 (상품과 카테고리 정보 포함)
    const orders = await Order.find(filter)
      .populate({
        path: 'items.product',
        select: 'category',
        populate: {
          path: 'category',
          select: 'parentCategory'
        }
      });

    // 카테고리별 매출 및 주문 건수 집계
    const categoryRevenue = {
      MAN: { revenue: 0, orderCount: 0 },
      WOMAN: { revenue: 0, orderCount: 0 },
      KIDS: { revenue: 0, orderCount: 0 },
      ACCESSORIES: { revenue: 0, orderCount: 0 }
    };

    orders.forEach(order => {
      const orderCategories = new Set();
      
      order.items.forEach(item => {
        const product = item.product;
        if (product && product.category && product.category.parentCategory) {
          const parentCategory = product.category.parentCategory;
          if (categoryRevenue.hasOwnProperty(parentCategory)) {
            categoryRevenue[parentCategory].revenue += item.totalPrice;
            orderCategories.add(parentCategory);
          }
        }
      });

      // 주문에 포함된 각 카테고리별로 주문 건수 증가
      orderCategories.forEach(category => {
        categoryRevenue[category].orderCount += 1;
      });
    });

    // 총 매출액 계산
    const totalRevenue = Object.values(categoryRevenue).reduce((sum, data) => sum + data.revenue, 0);

    // 비율 계산 및 정렬
    const categoryStats = Object.entries(categoryRevenue)
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        orderCount: data.orderCount,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue); // 매출액 기준 내림차순 정렬

    res.json({
      success: true,
      data: {
        categoryStats,
        totalRevenue,
        period
      }
    });
  } catch (error) {
    console.error('카테고리별 매출 통계 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '카테고리별 매출 통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};


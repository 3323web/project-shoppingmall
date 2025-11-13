import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// 위시리스트에 상품 추가 (로그인 필요)
router.post('/wishlist', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID는 필수입니다.'
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

    // 이미 위시리스트에 있는지 확인
    const existingWishlist = await Wishlist.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingWishlist) {
      return res.status(400).json({
        success: false,
        message: '이미 위시리스트에 추가된 상품입니다.'
      });
    }

    // 위시리스트에 추가
    const wishlist = new Wishlist({
      user: req.user.id,
      product: productId
    });

    await wishlist.save();

    res.status(201).json({
      success: true,
      message: '위시리스트에 추가되었습니다.',
      data: wishlist
    });
  } catch (error) {
    console.error('위시리스트 추가 에러:', error);
    res.status(500).json({
      success: false,
      message: '위시리스트 추가 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자의 위시리스트 조회 (로그인 필요)
router.get('/wishlist', authenticate, async (req, res) => {
  try {
    const wishlists = await Wishlist.find({ user: req.user.id })
      .populate({
        path: 'product',
        select: 'sku name price marketPrice listImage productStatus'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: wishlists,
      count: wishlists.length
    });
  } catch (error) {
    console.error('위시리스트 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '위시리스트 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 위시리스트에서 상품 제거 (로그인 필요)
router.delete('/wishlist/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOneAndDelete({
      user: req.user.id,
      product: productId
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: '위시리스트에서 해당 상품을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '위시리스트에서 제거되었습니다.'
    });
  } catch (error) {
    console.error('위시리스트 제거 에러:', error);
    res.status(500).json({
      success: false,
      message: '위시리스트 제거 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 특정 상품이 위시리스트에 있는지 확인 (로그인 필요)
router.get('/wishlist/check/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: req.user.id,
      product: productId
    });

    res.json({
      success: true,
      isInWishlist: !!wishlist
    });
  } catch (error) {
    console.error('위시리스트 확인 에러:', error);
    res.status(500).json({
      success: false,
      message: '위시리스트 확인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;


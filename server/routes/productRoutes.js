import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.js';

const router = express.Router();

// 상품 생성 (관리자 전용)
router.post('/products', authenticate, authorizeAdmin, async (req, res) => {
  try {
    // SKU 중복 체크
    const existingProduct = await Product.findOne({ sku: req.body.sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 상품코드(SKU)입니다.'
      });
    }

    const product = new Product(req.body);
    const savedProduct = await product.save();
    
    // 카테고리 정보와 함께 반환
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate('category', 'name slug parentCategory description');
    
    res.status(201).json({
      success: true,
      message: '상품이 등록되었습니다.',
      data: populatedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 상품 목록 조회 (페이지네이션 및 검색 지원)
router.get('/products', async (req, res) => {
  try {
    const { 
      category, 
      parentCategory,
      isActive,
      productStatus,
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'sortOrder', // 정렬순서순, price(할인가), sku(상품코드), name(상품명), adminName(관리자용상품명)
      sortOrder = 'desc' // desc(내림차순), asc(오름차순)
    } = req.query;
    
    const filter = {};
    
    // 1차 카테고리 필터링 (MongoDB 쿼리 단계에서 처리)
    if (parentCategory) {
      // 해당 1차 카테고리에 속한 2차 카테고리 ID 목록 조회
      const categories = await Category.find({ 
        parentCategory: parentCategory
        // isActive 조건 제거 - 비활성 카테고리의 상품도 조회 가능하도록
      }).select('_id');
      
      const categoryIds = categories.map(c => c._id);
      
      console.log(`1차 카테고리 ${parentCategory}의 2차 카테고리 개수:`, categoryIds.length);
      
      if (categoryIds.length > 0) {
        filter.category = { $in: categoryIds };
      } else {
        // 해당 1차 카테고리에 2차 카테고리가 없으면 빈 결과 반환
        console.log(`${parentCategory} 카테고리에 등록된 2차 카테고리가 없습니다.`);
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page: parseInt(page),
          totalPages: 0,
          statusCounts: {
            total: await Product.countDocuments({}),
            selling: await Product.countDocuments({ productStatus: '판매중' }),
            outOfStock: await Product.countDocuments({ productStatus: '일시품절' }),
            ended: await Product.countDocuments({ productStatus: '판매종료' })
          },
          data: []
        });
      }
    }
    
    // 2차 카테고리 필터 (직접 지정된 경우)
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (productStatus) filter.productStatus = productStatus;
    
    // 검색 조건 (공급업체, 상품명, 관리자용상품명, 상품코드)
    if (search) {
      filter.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { adminName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 페이지네이션 계산
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 전체 상품 수
    const total = await Product.countDocuments(filter);
    
    // 정렬 설정
    const sortField = sortBy || 'sortOrder';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortField] = sortDirection;
    
    // 상품 조회
    console.log('Product 쿼리 필터:', JSON.stringify(filter));
    const products = await Product.find(filter)
      .populate('category', 'name slug parentCategory')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log('조회된 상품 수:', products.length)
    
    // 판매상태별 통계
    const statusCounts = {
      total: await Product.countDocuments({}),
      selling: await Product.countDocuments({ productStatus: '판매중' }),
      outOfStock: await Product.countDocuments({ productStatus: '일시품절' }),
      ended: await Product.countDocuments({ productStatus: '판매종료' })
    };
    
    res.status(200).json({
      success: true,
      count: products.length,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      statusCounts: statusCounts,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 특정 상품 조회
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug parentCategory description');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 상품 수정 (관리자 전용)
router.put('/products/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    // SKU 중복 체크 (현재 상품 제외)
    if (req.body.sku) {
      const existingProduct = await Product.findOne({ 
        sku: req.body.sku,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: '이미 존재하는 상품코드(SKU)입니다.'
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug parentCategory description');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '상품이 수정되었습니다.',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 상품 삭제 (관리자 전용)
router.delete('/products/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '상품이 삭제되었습니다.',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// SKU로 상품 조회
router.get('/products/sku/:sku', async (req, res) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() })
      .populate('category', 'name slug parentCategory description');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 상품 상태별 조회
router.get('/products/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    const products = await Product.find({ productStatus: status })
      .populate('category', 'name slug parentCategory')
      .sort({ sortOrder: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 상품 통계 조회 (판매상태별 개수)
router.get('/products/stats/counts', async (req, res) => {
  try {
    const statusCounts = {
      total: await Product.countDocuments({}),
      selling: await Product.countDocuments({ productStatus: '판매중' }),
      outOfStock: await Product.countDocuments({ productStatus: '일시품절' }),
      ended: await Product.countDocuments({ productStatus: '판매종료' })
    };
    
    res.status(200).json({
      success: true,
      data: statusCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;



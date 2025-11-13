import express from 'express';
import Category from '../models/Category.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.js';

const router = express.Router();

// 카테고리 생성 (관리자 전용)
router.post('/categories', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, slug, parentCategory, description, sortOrder } = req.body;
    
    // 슬러그 중복 체크
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 슬러그입니다.'
      });
    }
    
    const category = new Category({
      name,
      slug,
      parentCategory,
      description,
      sortOrder
    });
    
    const savedCategory = await category.save();
    
    res.status(201).json({
      success: true,
      data: savedCategory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 카테고리 목록 조회 (전체 공개)
router.get('/categories', async (req, res) => {
  try {
    const { parentCategory, isActive } = req.query;
    const filter = {};
    
    if (parentCategory) filter.parentCategory = parentCategory;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const categories = await Category.find(filter).sort({ parentCategory: 1, sortOrder: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 1차 카테고리별로 그룹화하여 조회
router.get('/categories/grouped', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ parentCategory: 1, sortOrder: 1 });
    
    const grouped = {
      MAN: categories.filter(c => c.parentCategory === 'MAN'),
      WOMAN: categories.filter(c => c.parentCategory === 'WOMAN'),
      KIDS: categories.filter(c => c.parentCategory === 'KIDS'),
      ACCESSORIES: categories.filter(c => c.parentCategory === 'ACCESSORIES')
    };
    
    res.status(200).json({
      success: true,
      data: grouped
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 특정 카테고리 조회
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '카테고리를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 카테고리 수정 (관리자 전용)
router.put('/categories/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { name, slug, parentCategory, description, isActive, sortOrder } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, slug, parentCategory, description, isActive, sortOrder },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '카테고리를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 카테고리 삭제 (관리자 전용)
router.delete('/categories/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '카테고리를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '카테고리가 삭제되었습니다.',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 카테고리 순서 변경 (관리자 전용)
router.patch('/categories/:id/reorder', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { direction } = req.body; // 'up' 또는 'down'
    const currentCategory = await Category.findById(req.params.id);
    
    if (!currentCategory) {
      return res.status(404).json({
        success: false,
        message: '카테고리를 찾을 수 없습니다.'
      });
    }
    
    const currentOrder = currentCategory.sortOrder;
    
    // 같은 1차 카테고리 내에서 인접한 카테고리 찾기
    let targetCategory;
    if (direction === 'up') {
      // 현재 순서보다 작은 것 중 가장 큰 순서 찾기
      targetCategory = await Category.findOne({
        parentCategory: currentCategory.parentCategory,
        sortOrder: { $lt: currentOrder }
      }).sort({ sortOrder: -1 });
    } else if (direction === 'down') {
      // 현재 순서보다 큰 것 중 가장 작은 순서 찾기
      targetCategory = await Category.findOne({
        parentCategory: currentCategory.parentCategory,
        sortOrder: { $gt: currentOrder }
      }).sort({ sortOrder: 1 });
    }
    
    if (!targetCategory) {
      return res.status(400).json({
        success: false,
        message: '더 이상 이동할 수 없습니다.'
      });
    }
    
    // 순서 교환
    const tempOrder = currentCategory.sortOrder;
    currentCategory.sortOrder = targetCategory.sortOrder;
    targetCategory.sortOrder = tempOrder;
    
    await currentCategory.save();
    await targetCategory.save();
    
    res.status(200).json({
      success: true,
      message: '순서가 변경되었습니다.',
      data: currentCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;


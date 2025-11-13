import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.js';

const router = express.Router();

// 유저 생성 (회원가입)
router.post('/users', async (req, res) => {
  try {
    const { email, name, password, phone, user_type, address } = req.body;
    
    // 이메일 중복 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 등록된 이메일입니다.'
      });
    }
    
    const user = new User({
      email,
      name,
      password, // pre-save 미들웨어에서 자동으로 암호화됨
      phone,
      user_type: user_type || 'customer',
      address
    });
    
    const savedUser = await user.save();
    
    // 응답에서 비밀번호 제외
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 유저 목록 조회
router.get('/users', async (req, res) => {
  try {
    const { user_type } = req.query;
    const filter = {};
    
    if (user_type) filter.user_type = user_type;
    
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 토큰으로 현재 로그인한 유저 정보 가져오기 (반드시 /users/:id 보다 먼저 정의해야 함!)
router.get('/users/me', authenticate, async (req, res) => {
  try {
    // authenticate 미들웨어에서 req.user에 사용자 정보를 추가함
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 회원 통계 조회 (관리자 전용) - /users/:id 보다 먼저 정의해야 함!
router.get('/users/stats', authenticate, authorizeAdmin, async (req, res) => {
  try {
    // 전체 회원수 (customer 타입만)
    const totalUsers = await User.countDocuments({ user_type: 'customer' });

    // 이번달 가입한 회원수
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // 이번달 시작일 (로컬 시간대 기준)
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    
    // 이번달 종료일 (로컬 시간대 기준) - 다음 달 1일 00:00:00에서 1ms 빼기
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    const monthlyNewUsers = await User.countDocuments({
      user_type: 'customer',
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    // 첫 번째 회원 가입일 조회
    const firstUser = await User.findOne({ user_type: 'customer' })
      .sort({ createdAt: 1 })
      .select('createdAt');

    let averageMonthlyUsers = 0;
    if (firstUser) {
      const firstUserDate = new Date(firstUser.createdAt);
      const monthsDiff = (now.getFullYear() - firstUserDate.getFullYear()) * 12 + 
                         (now.getMonth() - firstUserDate.getMonth()) + 1; // +1은 현재 월 포함
      
      if (monthsDiff > 0) {
        averageMonthlyUsers = Math.round(totalUsers / monthsDiff);
      }
    }

    // 누적 탈퇴회원 (현재 User 모델에 탈퇴 필드가 없으므로 0으로 설정)
    // 추후 User 모델에 isDeleted 또는 deletedAt 필드 추가 시 수정 필요
    const deletedUsers = 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        monthlyNewUsers,
        averageMonthlyUsers,
        deletedUsers
      }
    });
  } catch (error) {
    console.error('회원 통계 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '회원 통계 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 특정 유저 조회
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 유저 정보 수정
router.put('/users/:id', async (req, res) => {
  try {
    const { email, name, password, phone, user_type, address } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.'
      });
    }
    
    // 업데이트할 필드 설정
    if (email) user.email = email;
    if (name) user.name = name;
    if (password) user.password = password; // pre-save 미들웨어에서 자동으로 암호화됨
    if (phone) user.phone = phone;
    if (user_type) user.user_type = user_type;
    if (address !== undefined) user.address = address;
    
    // save()를 호출하여 pre-save 미들웨어 트리거
    await user.save();
    
    // 응답에서 비밀번호 제외
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 유저 삭제
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '유저가 삭제되었습니다.',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 이메일로 유저 찾기 (로그인용)
router.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }
    
    // 비밀번호 비교 (bcrypt 사용)
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        user_type: user.user_type
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    );
    
    // 응답에서 비밀번호 제외
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: '로그인 성공',
      token: token,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;


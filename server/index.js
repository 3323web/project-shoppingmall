import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// 환경변수 로드
dotenv.config();

const app = express();

// MongoDB 연결 설정
// MONGODB_ATLAS_URI가 있으면 사용, 없으면 로컬 MongoDB 사용
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/study_shoppingmall';
const PORT = process.env.PORT || 5000;

// MongoDB 연결
mongoose.connect(MONGODB_URI)
  .then(() => {
    const connectionType = process.env.MONGODB_ATLAS_URI ? 'MongoDB Atlas' : '로컬 MongoDB';
    console.log(`MongoDB 연결 성공 (${connectionType})`);
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`); // 비밀번호 마스킹
    });
  })
  .catch((error) => {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  });

// CORS 설정
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 기본 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Study Shopping Mall Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check 라우트
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 라우터
app.use('/api', productRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', wishlistRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);

// 404 처리
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청하신 API 엔드포인트를 찾을 수 없습니다.'
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});


# Study Shopping Mall - Backend API

Node.js + Express + MongoDB로 구현한 쇼핑몰 백엔드 API 서버입니다.

## 기술 스택

- **Node.js**: JavaScript 런타임
- **Express**: 웹 프레임워크
- **MongoDB**: NoSQL 데이터베이스
- **Mongoose**: MongoDB ODM

## 설치 방법

1. 패키지 설치
```bash
npm install
```

2. 환경변수 설정
```bash
# .env.example 파일을 .env로 복사
cp .env.example .env

# .env 파일을 열어 필요한 설정 변경
```

3. MongoDB 실행
```bash
# MongoDB가 로컬에 설치되어 있어야 합니다
# Windows: MongoDB 서비스 시작
# Mac/Linux: mongod
```

## 실행 방법

### 개발 모드 (파일 변경 시 자동 재시작)
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

## API 엔드포인트

### 기본
- `GET /` - API 정보
- `GET /health` - 헬스 체크

### 상품 (Products)
- `POST /api/products` - 상품 생성 (관리자 전용)
- `GET /api/products` - 상품 목록 조회 (쿼리: category, isActive)
- `GET /api/products/:id` - 특정 상품 조회
- `GET /api/products/sku/:sku` - SKU로 상품 조회
- `GET /api/products/status/:status` - 상품 상태별 조회 (판매중, 일시품절, 판매종료)
- `PUT /api/products/:id` - 상품 수정 (관리자 전용)
- `DELETE /api/products/:id` - 상품 삭제 (관리자 전용)

### 유저 (Users)
- `POST /api/users` - 유저 생성 (회원가입)
- `GET /api/users` - 유저 목록 조회 (쿼리: user_type)
- `GET /api/users/:id` - 특정 유저 조회
- `PUT /api/users/:id` - 유저 정보 수정
- `DELETE /api/users/:id` - 유저 삭제
- `POST /api/users/login` - 로그인 (JWT 토큰 발급)
- `GET /api/users/me` - 현재 로그인한 유저 정보 조회 (인증 필요)

### 카테고리 (Categories)
- `POST /api/categories` - 카테고리 생성 (관리자 전용)
- `GET /api/categories` - 카테고리 목록 조회 (쿼리: parentCategory, isActive)
- `GET /api/categories/grouped` - 1차 카테고리별로 그룹화하여 조회
- `GET /api/categories/:id` - 특정 카테고리 조회
- `PUT /api/categories/:id` - 카테고리 수정 (관리자 전용)
- `DELETE /api/categories/:id` - 카테고리 삭제 (관리자 전용)

## 프로젝트 구조

```
server/
├── models/          # Mongoose 모델
│   ├── Product.js   # 상품 모델
│   ├── User.js      # 유저 모델
│   └── Category.js  # 카테고리 모델
├── routes/          # Express 라우터
│   ├── productRoutes.js   # 상품 라우터
│   ├── userRoutes.js      # 유저 라우터
│   └── categoryRoutes.js  # 카테고리 라우터
├── middlewares/     # 미들웨어
│   └── auth.js      # JWT 인증 미들웨어
├── index.js         # 메인 서버 파일
├── package.json     # 프로젝트 설정
└── .env             # 환경변수
```

## 카테고리 시스템 사용법

### 1차 카테고리 (고정)
- `MAN` - 남성
- `WOMAN` - 여성
- `KIDS` - 키즈
- `ACCESSORIES` - 액세서리

### 2차 카테고리 (관리자가 CRUD)

**카테고리 생성 예시:**
```bash
POST /api/categories
Authorization: Bearer {admin_token}

{
  "name": "Shirts",
  "slug": "shirts",
  "parentCategory": "MAN",
  "description": "남성 셔츠 컬렉션",
  "sortOrder": 1
}
```

**카테고리 목록 조회:**
```bash
GET /api/categories?parentCategory=MAN
```

**그룹화된 카테고리 조회:**
```bash
GET /api/categories/grouped
```

**응답:**
```json
{
  "success": true,
  "data": {
    "MAN": [
      { "name": "Shirts", "slug": "shirts", ... },
      { "name": "Pants", "slug": "pants", ... }
    ],
    "WOMAN": [...],
    "KIDS": [...],
    "ACCESSORIES": [...]
  }
}
```

**상품 생성 시 카테고리 지정:**
```bash
POST /api/products

{
  "name": "화이트 셔츠",
  "price": 50000,
  "category": "673abc..." // Category ObjectId
}
```

## JWT 인증 사용법

### 1. 로그인하여 토큰 받기

```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "test123"
}
```

**응답:**
```json
{
  "success": true,
  "message": "로그인 성공",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "...",
    "email": "test@test.com",
    "name": "홍길동",
    ...
  }
}
```

### 2. 토큰으로 현재 사용자 정보 조회

```bash
GET /api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "test@test.com",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "user_type": "customer",
    ...
  }
}
```

### 3. 라우트에 인증 미들웨어 적용 예시

```javascript
import { authenticate, authorizeAdmin } from '../middlewares/auth.js';

// 인증이 필요한 라우트
router.get('/protected', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// 관리자 권한이 필요한 라우트
router.delete('/admin-only', authenticate, authorizeAdmin, (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

## 개발 가이드

### 모델 추가
`models/` 폴더에 Mongoose 스키마 파일 생성

### 라우터 추가
`routes/` 폴더에 Express 라우터 파일 생성 후 `index.js`에 등록


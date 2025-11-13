import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, '이메일은 필수입니다.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, '유효한 이메일 주소를 입력해주세요.']
  },
  name: {
    type: String,
    required: [true, '이름은 필수입니다.'],
    trim: true,
    maxlength: [100, '이름은 100자 이하여야 합니다.']
  },
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다.'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.'],
    match: [/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{6,}$/, '비밀번호는 영문과 숫자를 조합하여 최소 6자 이상이어야 합니다.']
  },
  phone: {
    type: String,
    required: [true, '휴대폰번호는 필수입니다.'],
    trim: true,
    match: [/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '유효한 휴대폰번호를 입력해주세요. (예: 010-1234-5678 또는 01012345678)']
  },
  user_type: {
    type: String,
    required: [true, '사용자 유형은 필수입니다.'],
    enum: {
      values: ['customer', 'admin'],
      message: '사용자 유형은 customer 또는 admin이어야 합니다.'
    },
    default: 'customer'
  },
  address: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// 비밀번호 저장 전 암호화
userSchema.pre('save', async function(next) {
  // 비밀번호가 수정되지 않았다면 다음으로 진행
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // 비밀번호 암호화 (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;


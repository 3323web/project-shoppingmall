import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // 페이지 로드 시 이미 로그인되어 있는지 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        
        if (!token) {
          setChecking(false)
          return
        }

        // 토큰으로 유저 정보 확인
        const response = await fetch(`${API_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (data.success) {
          // 이미 로그인되어 있으면 메인 페이지로 리다이렉트
          console.log('✅ 이미 로그인되어 있습니다. 메인 페이지로 이동합니다.')
          navigate('/')
        } else {
          // 토큰이 유효하지 않으면 제거
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          localStorage.removeItem('user')
          setChecking(false)
        }
      } catch (error) {
        console.error('인증 확인 실패:', error)
        setChecking(false)
      }
    }

    checkAuth()
  }, [navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        // 토큰 저장
        if (rememberMe) {
          localStorage.setItem('token', data.token)
        } else {
          sessionStorage.setItem('token', data.token)
        }
        localStorage.setItem('user', JSON.stringify(data.data))
        
        // 다른 컴포넌트에 로그인 알림
        window.dispatchEvent(new Event('authChange'))
        
        alert(`${data.data.name}님 환영합니다`)
        navigate('/')
      } else {
        setError(data.message || '로그인에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 인증 확인 중일 때 로딩 표시
  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
          <p style={{ color: '#666' }}>확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <>
    <div style={{ backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '50px', paddingBottom: '50px', paddingLeft: '20px', paddingRight: '20px' }}>
      <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        
        {/* Left Column - Login Form */}
        <div style={{ flex: 1, padding: '60px 80px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '600', marginBottom: '10px', color: '#1a1a1a' }}>
            Welcome Back
          </h1>
          <p style={{ color: '#666', marginBottom: '40px', fontSize: '15px', lineHeight: '1.6' }}>
            Log in to your account to access your orders and saved items.
          </p>

          <form onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                style={inputStyle}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={eyeButtonStyle}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: '14px', color: '#555', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <div style={{ color: '#dc3545', marginBottom: '20px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={loginButtonStyle}
            >
              {loading ? 'LOGGING IN...' : 'LOG IN'}
            </button>

            {/* Signup Link */}
            <p style={{ textAlign: 'center', marginTop: '25px', color: '#666', fontSize: '14px' }}>
              Don't have an account? <Link to="/signup" style={{ color: '#1a1a1a', fontWeight: '500', textDecoration: 'none' }}>Sign up</Link>
            </p>
          </form>
        </div>

        {/* Right Column - Information */}
        <div style={{ flex: 0.9, padding: '60px 80px', backgroundColor: '#fafafa', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
          
          {/* Why Log In Section */}
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#1a1a1a' }}>
              Why Log In?
            </h2>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: '2', color: '#555', fontSize: '14px' }}>
              <li>Access your order history and track shipments</li>
              <li>Save your favorite items and wishlist</li>
              <li>Faster checkout with saved information</li>
              <li>Exclusive member offers and early access</li>
            </ul>
          </div>

          {/* New to LUXE Section */}
          <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '1px', marginBottom: '15px', color: '#1a1a1a' }}>
              NEW TO LUXE?
            </h3>
            <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              Create an account to enjoy a personalized shopping experience with exclusive benefits.
            </p>
            <Link to="/signup">
              <button style={createAccountButtonStyle}>
                CREATE ACCOUNT
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  color: '#333',
  marginBottom: '8px'
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '15px',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
}

const eyeButtonStyle = {
  position: 'absolute',
  right: '15px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '20px'
}

const loginButtonStyle = {
  width: '100%',
  padding: '16px',
  backgroundColor: '#1a1a1a',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  letterSpacing: '1px',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
}

const createAccountButtonStyle = {
  width: '100%',
  padding: '14px',
  backgroundColor: 'white',
  color: '#1a1a1a',
  border: '1px solid #1a1a1a',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '1px',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

export default Login


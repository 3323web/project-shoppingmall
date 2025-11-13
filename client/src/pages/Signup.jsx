import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    phone: '',
    user_type: 'customer',
    address: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 비밀번호 확인
    if (formData.password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        alert('회원가입이 완료되었습니다!')
        navigate('/')
      } else {
        setError(data.message || '회원가입에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', backgroundColor: '#f8f9fa', padding: '50px 20px' }}>
      <div style={{ display: 'flex', maxWidth: '1200px', width: '100%', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        
        {/* Left Section - Form */}
        <div style={{ flex: 1, padding: '50px 60px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '600', marginBottom: '10px', color: '#1a1a1a' }}>Create Account</h1>
          <p style={{ color: '#666', marginBottom: '40px', fontSize: '15px' }}>
            Already have an account? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
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
                placeholder="john@example.com"
                required
                style={inputStyle}
              />
            </div>

            {/* NAME */}
            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>NAME</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                style={inputStyle}
              />
            </div>

            {/* PHONE */}
            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>PHONE</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                required
                style={inputStyle}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********"
                  required
                  minLength="6"
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

            {/* CONFIRM PASSWORD */}
            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength="6"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={eyeButtonStyle}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: '#dc3545', marginBottom: '20px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Terms Checkbox */}
            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'flex-start' }}>
              <input type="checkbox" required style={{ marginTop: '3px', marginRight: '10px' }} />
              <label style={{ fontSize: '14px', color: '#555', lineHeight: '1.5' }}>
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={createButtonStyle}
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>

        {/* Right Section - Benefits */}
        <div style={{ flex: 0.8, padding: '50px 60px', backgroundColor: '#fafafa' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '20px', color: '#1a1a1a' }}>Join LUXE</h2>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '40px', fontSize: '15px' }}>
            Become a member and gain access to exclusive benefits, early access to new collections, and personalized shopping experiences.
          </p>

          <div>
            {/* Benefit 1 */}
            <div style={benefitItemStyle}>
              <div style={numberCircleStyle}>1</div>
              <div>
                <h3 style={benefitTitleStyle}>Exclusive Access</h3>
                <p style={benefitDescStyle}>Early access to new items and special collections</p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div style={benefitItemStyle}>
              <div style={numberCircleStyle}>2</div>
              <div>
                <h3 style={benefitTitleStyle}>Personalized Experience</h3>
                <p style={benefitDescStyle}>Curated recommendations based on your style</p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div style={benefitItemStyle}>
              <div style={numberCircleStyle}>3</div>
              <div>
                <h3 style={benefitTitleStyle}>Rewards & Benefits</h3>
                <p style={benefitDescStyle}>Earn points on every purchase</p>
              </div>
            </div>
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

const createButtonStyle = {
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

const benefitItemStyle = {
  display: 'flex',
  gap: '20px',
  marginBottom: '35px'
}

const numberCircleStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: '#1a1a1a',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontWeight: '600',
  flexShrink: 0
}

const benefitTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '6px'
}

const benefitDescStyle = {
  fontSize: '14px',
  color: '#666',
  lineHeight: '1.5'
}

export default Signup


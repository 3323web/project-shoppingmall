import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={gridStyle}>
        {/* Brand Info */}
        <div>
          <h3 style={logoStyle}>LUXE</h3>
          <p style={taglineStyle}>
            Curating timeless fashion pieces for the modern individual
          </p>
        </div>

        {/* SHOP */}
        <div>
          <h4 style={headerStyle}>SHOP</h4>
          <div style={linksContainerStyle}>
            <Link to="/products?category=new" style={linkStyle}>New Arrivals</Link>
            <Link to="/products?category=woman" style={linkStyle}>Woman</Link>
            <Link to="/products?category=man" style={linkStyle}>Man</Link>
            <Link to="/products?category=accessories" style={linkStyle}>Accessories</Link>
          </div>
        </div>

        {/* HELP */}
        <div>
          <h4 style={headerStyle}>HELP</h4>
          <div style={linksContainerStyle}>
            <a href="#" style={linkStyle}>Contact Us</a>
            <a href="#" style={linkStyle}>Shipping Info</a>
            <a href="#" style={linkStyle}>Returns</a>
            <a href="#" style={linkStyle}>FAQ</a>
          </div>
        </div>

        {/* FOLLOW */}
        <div>
          <h4 style={headerStyle}>FOLLOW</h4>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <a href="#" style={{ fontSize: '20px' }}>📷</a>
            <a href="#" style={{ fontSize: '20px' }}>👤</a>
            <a href="#" style={{ fontSize: '20px' }}>🐦</a>
          </div>
          <div style={linksContainerStyle}>
            <a href="#" style={linkStyle}>Privacy Policy</a>
            <a href="#" style={linkStyle}>Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={copyrightStyle}>
        <p style={{ fontSize: '13px', color: '#666' }}>© 2025 LUXE. All rights reserved.</p>
      </div>
    </footer>
  )
}

const footerStyle = {
  backgroundColor: '#1a1a1a',
  color: 'white',
  padding: '60px 60px 40px'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr',
  gap: '40px',
  maxWidth: '1400px',
  margin: '0 auto',
  paddingBottom: '40px',
  borderBottom: '1px solid #333'
}

const logoStyle = {
  fontSize: '24px',
  fontWeight: '700',
  marginBottom: '15px',
  letterSpacing: '2px'
}

const taglineStyle = {
  fontSize: '14px',
  color: '#999',
  lineHeight: '1.6',
  marginBottom: '30px'
}

const headerStyle = {
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '20px',
  letterSpacing: '1px'
}

const linksContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

const linkStyle = {
  color: '#999',
  textDecoration: 'none',
  fontSize: '13px'
}

const copyrightStyle = {
  textAlign: 'center',
  paddingTop: '30px'
}

export default Footer


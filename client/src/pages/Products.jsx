import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';

function Products() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // URL 쿼리 파라미터에서 카테고리 정보 가져오기
  const categoryId = searchParams.get('category');
  const parentCategory = searchParams.get('parentCategory');
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    // URL의 page 파라미터 읽기
    const pageParam = searchParams.get('page');
    if (pageParam) {
      setCurrentPage(parseInt(pageParam));
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [categoryId, parentCategory, currentPage, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 8,
        isActive: true,
        productStatus: '판매중',
        sortBy: 'sortOrder',
        sortOrder: 'desc'
      };

      // 2차 카테고리 필터
      if (categoryId) {
        params.category = categoryId;
      }
      
      // 1차 카테고리 필터
      if (parentCategory) {
        params.parentCategory = parentCategory;
      }

      // 검색어 필터
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await productService.getProducts(params);
      
      if (response.success) {
        setProducts(response.data);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error('상품 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // URL 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page);
    navigate(`/products?${newSearchParams.toString()}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 카테고리 이름 가져오기
  const getCategoryTitle = () => {
    if (searchQuery) {
      return `"${searchQuery}" 검색 결과`;
    }
    if (categoryId && products.length > 0 && products[0].category) {
      return products[0].category.name;
    }
    if (parentCategory) {
      return parentCategory;
    }
    return 'All Products';
  };

  return (
    <section style={{ padding: '80px 60px', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={titleStyle}>{getCategoryTitle()}</h2>
        <p style={subtitleStyle}>
          {total > 0 ? `총 ${total}개의 상품` : '등록된 상품이 없습니다.'}
        </p>
      </div>

      {/* Products Grid */}
      <div style={gridStyle}>
        {loading ? (
          <p style={messageStyle}>로딩 중...</p>
        ) : products.length === 0 ? (
          <p style={messageStyle}>등록된 상품이 없습니다.</p>
        ) : (
          products.map((product) => (
            <ProductCard key={product._id} product={product} navigate={navigate} />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={paginationContainerStyle}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              ...paginationButtonStyle,
              backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
              color: currentPage === 1 ? '#ccc' : '#333',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            이전
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // 현재 페이지 주변 5개 페이지만 표시
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 2 && page <= currentPage + 2)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    ...paginationButtonStyle,
                    backgroundColor: currentPage === page ? '#1a1a1a' : 'white',
                    color: currentPage === page ? 'white' : '#333',
                    fontWeight: currentPage === page ? '600' : '400'
                  }}
                >
                  {page}
                </button>
              );
            } else if (
              page === currentPage - 3 ||
              page === currentPage + 3
            ) {
              return <span key={page} style={paginationEllipsisStyle}>...</span>;
            }
            return null;
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              ...paginationButtonStyle,
              backgroundColor: currentPage === totalPages ? '#f5f5f5' : 'white',
              color: currentPage === totalPages ? '#ccc' : '#333',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            다음
          </button>
        </div>
      )}
    </section>
  );
}

function ProductCard({ product, navigate }) {
  const handleClick = () => {
    navigate(`/product/${product._id}`);
  };

  return (
    <div style={{ cursor: 'pointer' }} onClick={handleClick}>
      {product.listImage ? (
        <img 
          src={product.listImage} 
          alt={product.name}
          style={{
            width: '100%',
            aspectRatio: '3/4',
            objectFit: 'cover',
            marginBottom: '15px',
            transition: 'opacity 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        />
      ) : (
        <div style={imageBoxStyle}>이미지 없음</div>
      )}
      <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px', letterSpacing: '0.3px' }}>
        {product.sku}
      </div>
      <h3 style={productNameStyle}>{product.name}</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={originalPriceStyle}>
          {product.marketPrice?.toLocaleString()}원
        </span>
        <span style={discountPriceStyle}>
          {product.price?.toLocaleString()}원
        </span>
      </div>
    </div>
  );
}

const titleStyle = {
  fontSize: '36px',
  fontWeight: '400',
  marginBottom: '15px',
  color: '#1a1a1a'
};

const subtitleStyle = {
  fontSize: '15px',
  color: '#666',
  letterSpacing: '0.3px'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '30px',
  maxWidth: '1400px',
  margin: '0 auto',
  minHeight: '400px'
};

const messageStyle = {
  gridColumn: '1 / -1',
  textAlign: 'center',
  color: '#666',
  padding: '60px 0'
};

const imageBoxStyle = {
  backgroundColor: '#f8f8f8',
  aspectRatio: '3/4',
  marginBottom: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#999',
  fontSize: '14px'
};

const productNameStyle = {
  fontSize: '15px',
  fontWeight: '500',
  marginBottom: '8px',
  color: '#1a1a1a'
};

const originalPriceStyle = {
  fontSize: '14px',
  color: '#999',
  textDecoration: 'line-through'
};

const discountPriceStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a'
};

const paginationContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  marginTop: '60px'
};

const paginationButtonStyle = {
  padding: '10px 16px',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  minWidth: '44px'
};

const paginationEllipsisStyle = {
  padding: '10px 8px',
  color: '#666',
  fontSize: '14px'
};

export default Products;

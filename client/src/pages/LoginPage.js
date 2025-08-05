import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function LoginPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [surveyType, setSurveyType] = useState('v1'); // 기본값: 고교선택적성검사
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 검사 타입 목록
  const surveyOptions = [
    { value: 'v1', label: '고교선택적성검사', database: 'SSL-survey-v1' },
    { value: 'v2', label: '대학진학적성검사', database: 'SSL-survey-v2' },
    { value: 'v3', label: '직업선택적성검사', database: 'SSL-survey-v3' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🚀 Login form submitted with:', { name, code });

    try {
      console.log('📡 Sending login request to /api/auth/login');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, code, surveyType }),
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📄 Response data:', data);

      if (response.ok) {
        console.log('✅ Login successful:', data);
        
        // Store user info in sessionStorage for later use
        sessionStorage.setItem('userName', name);
        sessionStorage.setItem('userCode', code);
        sessionStorage.setItem('surveyType', surveyType);
        sessionStorage.setItem('isAdmin', data.isAdmin || false);
        
        console.log('💾 Data stored in sessionStorage:', {
          userName: sessionStorage.getItem('userName'),
          userCode: sessionStorage.getItem('userCode'),
          surveyType: sessionStorage.getItem('surveyType'),
          isAdmin: sessionStorage.getItem('isAdmin')
        });
        
        console.log('🔄 Attempting to navigate to /wait');
        navigate('/wait'); 
        console.log('🎯 Navigate command executed');
      } else {
        console.error('❌ Login failed:', data);
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('🔥 Network error or unexpected issue:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('🏁 Login process completed, isLoading set to false');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>SSL 학업적성검사 시스템</h1>
          <p>SSL Academic Aptitude Test System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="surveyType">검사 종류 (Survey Type)</label>
            <div className="custom-select-container">
              <select
                id="surveyType"
                value={surveyType}
                onChange={(e) => setSurveyType(e.target.value)}
                className="custom-select"
                disabled={isLoading}
              >
                {surveyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">이름 (Name)</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="code">코드 (Code)</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="부여받은 코드를 입력하세요"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="instruction">부여받은 이름과 코드를 정확히 입력해주세요.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

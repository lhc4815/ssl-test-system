import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function CompletePage() {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get user information from session storage
    const storedUserName = sessionStorage.getItem('userName');
    const userCode = sessionStorage.getItem('userCode');
    
    if (!storedUserName || !userCode) {
      // If no user information, redirect to login
      navigate('/login');
      return;
    }

    setUserName(storedUserName);

    // Clear session storage after test completion (optional)
    // sessionStorage.clear();
  }, [navigate]);

  const handleReturnToLogin = () => {
    // Clear session storage
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="complete-page">
      <div className="complete-container">
        <div className="complete-header">
          <h1>적성검사 완료</h1>
          <p>Test Completed Successfully</p>
        </div>

        <div className="complete-content">
          <div className="completion-message">
            <h2>{userName}님, 고생하셨습니다!</h2>
            <p>적성검사가 성공적으로 완료되었습니다.</p>
          </div>

          <div className="test-summary">
            <h3>검사 요약</h3>
            <ul>
              <li>Type A 문항: 240개 완료</li>
              <li>Type B 문항: 10개 완료</li>
              <li>Type C 문항: 10개 완료</li>
              <li><strong>총 260개 문항 완료</strong></li>
            </ul>
          </div>

          <div className="next-steps">
            <h3>검사 결과</h3>
            <p>
              검사 결과는 보고서 형태로 제공될 예정입니다.<br/>
              문의사항이 있으시면 담당자에게 연락해 주세요.
            </p>
          </div>

          <div className="completion-actions">
            <button 
              className="return-button"
              onClick={handleReturnToLogin}
            >
              로그인 페이지로 돌아가기
            </button>
          </div>
        </div>

        <div className="complete-footer">
          
          <p className="contact-info">
            문의사항이 있으시면 관리자에게 연락해 주세요.<br/>
            scholarshifttube@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default CompletePage;

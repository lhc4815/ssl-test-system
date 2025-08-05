import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function WaitingPage() {
  console.log('🏠 WaitingPage component is rendering');
  const [userInfo, setUserInfo] = useState({
    name: '',
    school: '',
    schoolGrade: '', // 학년
    gender: '', // 성별
    studentPhone: '', // 학생연락처
    parentPhone: '', // 학부모연락처
    region: '', // 거주지역
    bGradeSubjectsCount: '', // B등급 과목수
    desiredHighSchool: '' // 진학희망고교
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const regions = [
    "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
    "경기도", "강원특별자치도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
  ];

  const desiredHighSchools = [
    "전국단위자사고", "광역단위자사고", "서울형자사고", "외국어고", "국제고", "영재고", "과학고", "일반고" 
  ];

  useEffect(() => {
    // Check if user is logged in
    const userName = sessionStorage.getItem('userName');
    const userCode = sessionStorage.getItem('userCode');
    const surveyType = sessionStorage.getItem('surveyType') || 'v1';
    
    if (!userName || !userCode) {
      navigate('/login');
      return;
    }

    // Pre-fill name from login
    setUserInfo(prev => ({ ...prev, name: userName }));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 연락처 필드는 숫자만 허용
    if (name === 'studentPhone' || name === 'parentPhone') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      // 11자리 제한
      const limitedNumbers = numbersOnly.slice(0, 11);
      setUserInfo(prev => ({ ...prev, [name]: limitedNumbers }));
    } else {
      setUserInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAdminJump = async (targetPhase) => {
    console.log(`🚀 Attempting admin jump to: ${targetPhase}`);
    setIsLoading(true);
    setError('');

    try {
      const userCode = sessionStorage.getItem('userCode');
      const surveyType = sessionStorage.getItem('surveyType') || 'v1';
      console.log('User code for admin jump:', userCode);
      
      const response = await fetch('/api/admin/jump-to-phase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-survey-type': surveyType
        },
        body: JSON.stringify({
          user_code: userCode,
          target_phase: targetPhase
        })
      });

      console.log('Admin jump API response status:', response.status);
      const data = await response.json();
      console.log('Admin jump API response data:', data);

      if (response.ok) {
        console.log('✅ Admin jump successful:', data);
        
        if (targetPhase === 'COMPLETE') {
          navigate('/complete');
        } else {
          // Store the target phase info for TestPage to jump to
          sessionStorage.setItem('adminJumpTarget', targetPhase);
          console.log(`Session storage 'adminJumpTarget' set to: ${targetPhase}`);
          navigate('/test');
          console.log('Navigating to /test');
        }
      } else {
        console.error('❌ Admin jump failed:', data);
        setError(data.message || '관리자 기능 실행에 실패했습니다.');
      }
    } catch (err) {
      console.error('🔥 Network or unexpected error in admin jump:', err);
      setError('관리자 기능 실행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      console.log('Admin jump process finished.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCode = sessionStorage.getItem('userCode');
      const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

      if (isAdmin) {
        // For admin users, skip form validation and go directly to test
        console.log('관리자가 정상 테스트를 시작합니다.');
        navigate('/test');
        return;
      }

      // Validate required fields
      const requiredFields = ['school', 'schoolGrade', 'gender', 'studentPhone', 'parentPhone', 'region', 'bGradeSubjectsCount', 'desiredHighSchool'];
      const emptyFields = requiredFields.filter(field => !userInfo[field] || String(userInfo[field]).trim() === '');
      
      if (emptyFields.length > 0) {
        setError('모든 필수 항목을 입력해주세요.');
        setIsLoading(false);
        return;
      }

      // Send user info to backend
      const userInfoData = {
        user_name: userInfo.name,
        school: userInfo.school,
        grade: parseInt(userInfo.schoolGrade), // 학년은 숫자로 변환
        gender: userInfo.gender,
        student_phone: userInfo.studentPhone,
        parent_phone: userInfo.parentPhone,
        region: userInfo.region,
        b_grade_subjects_count: parseInt(userInfo.bGradeSubjectsCount), // B등급 과목수 숫자로 변환
        desired_high_school: userInfo.desiredHighSchool,
        code: userCode
      };

      console.log('User info to be saved:', userInfoData);
      console.log('User code from session:', userCode);
      console.log('All required fields check:', {
        user_name: !!userInfoData.user_name,
        school: !!userInfoData.school,
        grade: !!userInfoData.grade,
        gender: !!userInfoData.gender,
        region: !!userInfoData.region,
        b_grade_subjects_count: userInfoData.b_grade_subjects_count !== undefined,
        desired_high_school: !!userInfoData.desired_high_school,
        code: !!userInfoData.code
      });
      
      const surveyType = sessionStorage.getItem('surveyType') || 'v1';
      
      const response = await fetch('/api/user/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-survey-type': surveyType
        },
        body: JSON.stringify(userInfoData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        // Store user info ID for later use
        sessionStorage.setItem('userInfoId', data.userInfoId);
        
        // Navigate to test page
        navigate('/test');
      } else {
        console.error('Server error response:', data);
        setError(data.message || '정보 저장에 실패했습니다.');
      }
      
    } catch (err) {
      console.error('Error saving user info:', err);
      setError('정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

  return (
    <div className="waiting-page">
      <div className="waiting-container">
        <div className="waiting-header">
          <div className="test-info">
            <h2>본 검사는 총 3단계로 구성되어 있으며, 제한 시간은 90분입니다.</h2>
            
            <div className="test-phases">
              <div className="phase">
                <span className="phase-number">1️⃣</span>
                <span className="phase-title">Type A: 학습성향검사</span>
                <span className="phase-details">– 총 240문항, 문항당 10초</span>
              </div>
              <div className="phase">
                <span className="phase-number">2️⃣</span>
                <span className="phase-title">Type B: 영어이해력검사</span>
                <span className="phase-details">– 총 10문항, 문항당 60초</span>
              </div>
              <div className="phase">
                <span className="phase-number">3️⃣</span>
                <span className="phase-title">Type C: 수학해결력검사</span>
                <span className="phase-details">– 총 10문항, 문항당 240초</span>
              </div>
            </div>
            
            <p className="important-notice">모든 단계는 검사 시작 후 자동으로 이어집니다. 제한시간을 준수하시기 바랍니다.</p>
          </div>
        </div>

        {isAdmin ? (
          <div className="admin-section">
            <h2>관리자 모드</h2>
            <p>관리자로 로그인되었습니다. 테스트 기능을 사용할 수 있습니다.</p>
            <div className="admin-controls">
              <button 
                className="admin-button"
                onClick={() => navigate('/test')}
              >
                정상 테스트 시작
              </button>
              <button 
                className="admin-button"
                onClick={() => handleAdminJump('B')}
                disabled={isLoading}
              >
                Type B로 점프
              </button>
              <button 
                className="admin-button"
                onClick={() => handleAdminJump('C')}
                disabled={isLoading}
              >
                Type C로 점프
              </button>
              <button 
                className="admin-button"
                onClick={() => handleAdminJump('COMPLETE')}
                disabled={isLoading}
              >
                완료화면으로 점프
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="user-info-form">
            <div className="form-section">
              <h3>개인정보 입력</h3>
              
              {/* 첫 번째 줄: 이름, 학교명, 학년 */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">이름</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userInfo.name}
                    onChange={handleInputChange}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="school">학교명 *</label>
                  <input
                    type="text"
                    id="school"
                    name="school"
                    value={userInfo.school}
                    onChange={handleInputChange}
                    placeholder="학교명"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="schoolGrade">학년 *</label>
                  <input
                    type="number"
                    id="schoolGrade"
                    name="schoolGrade"
                    value={userInfo.schoolGrade}
                    onChange={handleInputChange}
                    placeholder="학년"
                    min="1"
                    max="12"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 두 번째 줄: 성별, 학생연락처, 학부모연락처 */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">성별 *</label>
                  <div className="custom-select-container">
                    <select
                      id="gender"
                      name="gender"
                      value={userInfo.gender}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="custom-select"
                    >
                      <option value="">선택하세요</option>
                      <option value="남성">남성</option>
                      <option value="여성">여성</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="studentPhone">학생연락처 *</label>
                  <input
                    type="tel"
                    id="studentPhone"
                    name="studentPhone"
                    value={userInfo.studentPhone}
                    onChange={handleInputChange}
                    placeholder="01000000000"
                    pattern="[0-9]{11}"
                    maxLength="11"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="parentPhone">학부모연락처 *</label>
                  <input
                    type="tel"
                    id="parentPhone"
                    name="parentPhone"
                    value={userInfo.parentPhone}
                    onChange={handleInputChange}
                    placeholder="01000000000"
                    pattern="[0-9]{11}"
                    maxLength="11"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 세 번째 줄: 거주지역, B등급 과목수, 진학희망고교 */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="region">거주지역 *</label>
                  <div className="custom-select-container">
                    <select
                      id="region"
                      name="region"
                      value={userInfo.region}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="custom-select"
                    >
                      <option value="">선택하세요</option>
                      {regions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bGradeSubjectsCount">B등급 과목수 *</label>
                  <input
                    type="number"
                    id="bGradeSubjectsCount"
                    name="bGradeSubjectsCount"
                    value={userInfo.bGradeSubjectsCount}
                    onChange={handleInputChange}
                    placeholder="과목수"
                    min="0"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="desiredHighSchool">진학희망고교 *</label>
                  <div className="custom-select-container">
                    <select
                      id="desiredHighSchool"
                      name="desiredHighSchool"
                      value={userInfo.desiredHighSchool}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="custom-select"
                    >
                      <option value="">선택하세요</option>
                      {desiredHighSchools.map(school => (
                        <option key={school} value={school}>{school}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="start-test-button" disabled={isLoading}>
              {isLoading ? '처리 중...' : '검사 시작'}
            </button>
          </form>
        )}

        <div className="waiting-footer">
          <p className="instruction">
            {isAdmin 
              ? '관리자 기능을 이용할 수 있습니다.' 
              : '모든 정보를 정확히 입력한 후 검사를 시작해주세요.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default WaitingPage;

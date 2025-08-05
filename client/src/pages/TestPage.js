import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function TestPage() {
  console.log('🧪 TestPage component is rendering');
  const [currentPhase, setCurrentPhase] = useState('A'); // A, B, C
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeLeft, setTimeLeft] = useState(10); // Initial default for Type A
  const [questionData, setQuestionData] = useState(null); // For Type A/B, single question. For Type C, object with common_images and questions array.
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState({}); // Changed to object for Type C multiple answers, string for A/B
  const [error, setError] = useState('');
  const [isAnswerSelected, setIsAnswerSelected] = useState(false); // Re-introduced to prevent double-clicks for A/B
  const navigate = useNavigate();

  // Question limits for each phase
  const QUESTION_LIMITS = useMemo(() => ({
    'A': 240,
    'B': 10,
    'C': 10 // For Type C, this is the number of questions in the block (Q1-Q10)
  }), []);

  // Time limits for each phase (in seconds)
  const INITIAL_TIME_LIMITS = useMemo(() => ({
    'A': 10,
    'B': 120, // 2 minutes for Type B block (Q8-Q9)
    'C_INDIVIDUAL': 240, // 4 minutes for Q1-Q7 individual questions
    'C_BLOCK': 720 // 12 minutes for Q8-Q10 block
  }), []);

  // Get user code and survey type from session storage
  const userCode = sessionStorage.getItem('userCode');
  const surveyType = sessionStorage.getItem('surveyType') || 'v1';

  // Fetch question data from server
  const fetchQuestion = useCallback(async (type, number) => {
    console.log(`🔍 Fetching question: Type ${type}, Question ${number}`);
    setIsLoading(true);
    setError('');
    
    try {
      // For Type C Q1-Q7: individual questions, Q8: block of Q8-Q10
      const url = `/api/test/question/${type}/${number}`;
      console.log(`📡 Making API call to: ${url} with surveyType: ${surveyType}`);
      
      const response = await fetch(url, {
        headers: {
          'x-survey-type': surveyType
        }
      });
      const data = await response.json();

      console.log('📥 API Response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (response.ok) {
        console.log('✅ Setting question data:', data);
        setQuestionData(data);
        // For Type B blocks (Q8-Q9) and Type C blocks (Q8-Q10), initialize selectedAnswer for all questions in the block
        if ((type === 'B' || type === 'C') && data.is_block && data.questions) {
          const initialAnswers = {};
          data.questions.forEach(q => {
            initialAnswers[q.problem_number] = ''; // Initialize with empty string
          });
          console.log(`🔄 Resetting selectedAnswer for Type ${type} block:`, initialAnswers);
          setSelectedAnswer(initialAnswers); // 완전히 새로운 객체로 설정
          // Set time for blocks
          if (type === 'B') {
            setTimeLeft(INITIAL_TIME_LIMITS.B); // Type B block time
          } else {
            setTimeLeft(INITIAL_TIME_LIMITS.C_BLOCK); // Type C block time
          }
        } else {
          setSelectedAnswer(''); // Reset for Type A/B and Type C individual questions (Q1-Q7)
          // Set time based on question type
          if (type === 'C') {
            setTimeLeft(INITIAL_TIME_LIMITS.C_INDIVIDUAL); // Type C individual questions (Q1-Q7)
          } else {
            setTimeLeft(INITIAL_TIME_LIMITS[type]); // Type A/B
          }
        }
        // Reset isAnswerSelected when new question loads successfully
        setIsAnswerSelected(false);
      } else {
        console.error('❌ API Error:', data);
        setError(data.message || '문제를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('🔥 Network error fetching question:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [INITIAL_TIME_LIMITS, surveyType]);

  // Save answer to server
  const saveAnswer = useCallback(async (answersToSave) => { // Now accepts a single answer (A/B) or an object (C)
    console.log('🚀 Sending answer(s) to server:', answersToSave);
    console.log('🔍 Current phase:', currentPhase);
    console.log('🔍 Current question:', currentQuestion);
    console.log('🔍 QuestionData is_block:', questionData?.is_block);
    
    // Determine if this is a Type B or C block or individual question
    const isTypeBBlock = currentPhase === 'B' && questionData && questionData.is_block;
    const isTypeCBlock = currentPhase === 'C' && questionData && questionData.is_block;
    console.log('🔍 Is Type B Block:', isTypeBBlock);
    console.log('🔍 Is Type C Block:', isTypeCBlock);
    
    const requestData = {
      user_code: userCode,
      question_type: currentPhase,
      question_number: (isTypeBBlock || isTypeCBlock) ? null : currentQuestion, // Null for blocks, question number for individual
      selected_answer: answersToSave // This will be a string for A/individual, and an object for B/C blocks
    };

    console.log('📤 Request data being sent:', requestData);

    try {
      const response = await fetch('/api/test/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-survey-type': surveyType
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();
      console.log('📥 Server response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (!response.ok) {
        console.error('❌ Failed to save answer(s):', responseData);
        console.error('❌ Response status:', response.status);
        console.error('❌ Response message:', responseData.message || 'No message');
      } else {
        console.log('✅ Answer(s) saved successfully:', responseData);
      }
    } catch (err) {
      console.error('🔥 Network error saving answer(s):', err);
    }
  }, [userCode, currentPhase, currentQuestion, questionData, surveyType]);

  // Move to next question - simplified version
  const moveToNextQuestion = useCallback(async (shouldSaveAnswer = true, answersToSave = null) => {
    console.log('🔄 Moving to next question, shouldSave:', shouldSaveAnswer);
    
    // Save answer(s) if needed
    if (shouldSaveAnswer) {
      // For Type A/B, answersToSave is a single string. For Type C, it's the selectedAnswer object.
      const finalAnswers = answersToSave !== null ? answersToSave : selectedAnswer;
      await saveAnswer(finalAnswers);
    }
    
    // For Type C, check if all questions in the block are answered.
    // This check is now primarily handled by handleAnswerSelect for user input.
    // If timer expires for Type C, we save current answers and move.
    if (currentPhase === 'C' && Object.keys(selectedAnswer).length < QUESTION_LIMITS['C'] && answersToSave === null) {
      // This condition means timer expired but not all Type C questions were answered.
      // We still move to the next phase/completion, but log a warning.
      console.warn('⏰ Type C timer expired, but not all questions in block were answered. Saving current answers and moving to next phase.');
      // Do not call moveToNextQuestion here, it will be called by the timer effect or handleAnswerSelect
      return; 
    }

    const currentLimit = QUESTION_LIMITS[currentPhase];
    
    if (currentPhase === 'C' && currentQuestion < 8) { // For Type C Q1-Q7
      // Move to next individual Type C question
      setCurrentQuestion(prev => prev + 1);
      console.log(`➡️ Next Type C question: ${currentQuestion + 1}/${currentLimit}`);
    } else if (currentPhase === 'C' && currentQuestion === 8) { // For Type C Q8 (block)
      // Q8 block completed, move to test completion
      console.log('🏁 Type C completed, calling API');
      try {
        const response = await fetch('/api/test/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-survey-type': surveyType
          },
          body: JSON.stringify({ user_code: userCode })
        });

        if (response.ok) {
          console.log('✅ Test completion API successful');
          navigate('/complete');
        } else {
          console.error('❌ Test completion API failed');
          setError('테스트 완료 처리 중 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('Error completing test:', err);
        setError('테스트 완료 처리 중 오류가 발생했습니다.');
      }
      return;
    } else if (currentPhase === 'A' && currentQuestion < currentLimit) { // For Type A
      // Move to next question in Type A
      setCurrentQuestion(prev => prev + 1);
      console.log(`➡️ Next question: ${currentQuestion + 1}/${currentLimit}`);
    } else if (currentPhase === 'B' && currentQuestion < currentLimit) { // For Type B
      // Special handling for Type B: Q8 block (Q8-Q9) should jump to Q10  
      if (currentQuestion === 8 && questionData?.is_block) {
        // Q8 block completed, jump to Q10
        setCurrentQuestion(10);
        console.log(`➡️ Type B block completed, jumping to Q10`);
      } else {
        // Regular progression for other Type B questions
        setCurrentQuestion(prev => prev + 1);
        console.log(`➡️ Next question: ${currentQuestion + 1}/${currentLimit}`);
      }
    } else { // Move to next phase or complete test
      if (currentPhase === 'A') {
        console.log('📝 Moving to Type B');
        setCurrentPhase('B');
        setCurrentQuestion(1);
      } else if (currentPhase === 'B') {
        console.log('📝 Moving to Type C');
        setCurrentPhase('C');
        setCurrentQuestion(1); // For Type C, currentQuestion will represent the block, not individual question.
      } else {
        // Test completed
        console.log('🏁 Test completed, calling API');
        try {
          const response = await fetch('/api/test/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-survey-type': surveyType
            },
            body: JSON.stringify({ user_code: userCode })
          });

          if (response.ok) {
            console.log('✅ Test completion API successful');
            navigate('/complete');
          } else {
            console.error('❌ Test completion API failed');
            setError('테스트 완료 처리 중 오류가 발생했습니다.');
          }
        } catch (err) {
          console.error('Error completing test:', err);
          setError('테스트 완료 처리 중 오류가 발생했습니다.');
        }
        return;
      }
    }

    // Reset for next question/phase
    setSelectedAnswer(currentPhase === 'C' ? {} : ''); // Reset to empty object for Type C, or empty string for A/B
    setTimeLeft(INITIAL_TIME_LIMITS[currentPhase]); // Set time based on current phase
    // Don't reset isAnswerSelected here - it will be reset when new question loads
  }, [currentPhase, currentQuestion, selectedAnswer, saveAnswer, userCode, navigate, INITIAL_TIME_LIMITS, QUESTION_LIMITS, surveyType, questionData]);

  // Handle answer selection
  const handleAnswerSelect = useCallback(async (questionNum, answer) => { // Now accepts questionNum for Type C
    console.log(`🎯 User selected answer for Q${questionNum}:`, answer);
    console.log(`🔍 Current questionData.is_block:`, questionData?.is_block);
    console.log(`🔍 Current questionData.questions:`, questionData?.questions?.length);
    
    // For Type A/B, prevent multiple clicks on the same question
    if (currentPhase !== 'C' && isAnswerSelected) {
      console.log('🚫 Answer already selected for Type A/B, ignoring duplicate click');
      return;
    }
    
    // Update selectedAnswer state
    setSelectedAnswer(prev => ({ ...prev, [questionNum]: answer }));
    
    // Handle post-selection logic
    if (currentPhase === 'B' && questionData.is_block && questionData.questions) {
      console.log('📝 Processing Type B block question');
      // Q8-Q9 block: check if all questions in the block are answered
      const newSelected = { ...selectedAnswer, [questionNum]: answer };
      console.log('🔍 Current selected answers:', newSelected);
      const allAnswered = questionData.questions.every(q => newSelected[q.problem_number] !== '' && newSelected[q.problem_number] !== undefined);
      console.log('🔍 All questions answered?', allAnswered);
      if (allAnswered) {
        console.log('✅ All Type B questions in block answered.');
        setTimeLeft(-1); // Stop the timer
        moveToNextQuestion(true, newSelected); // Pass the entire block of answers
      } else {
        console.log('⏳ Waiting for more answers in Type B block...');
      }
    } else if (currentPhase === 'C') {
      // For Type C, distinguish between individual questions (Q1-Q7) and block questions (Q8-Q10)
      if (questionData.is_block && questionData.questions) {
        console.log('📝 Processing Type C block question');
        // Q8-Q10 block: check if all questions in the block are answered
        const newSelected = { ...selectedAnswer, [questionNum]: answer };
        console.log('🔍 Current selected answers:', newSelected);
        const allAnswered = questionData.questions.every(q => newSelected[q.problem_number] !== '' && newSelected[q.problem_number] !== undefined);
        console.log('🔍 All questions answered?', allAnswered);
        if (allAnswered) {
          console.log('✅ All Type C questions in block answered.');
          setTimeLeft(-1); // Stop the timer
          moveToNextQuestion(true, newSelected); // Pass the entire block of answers
        } else {
          console.log('⏳ Waiting for more answers in Type C block...');
        }
      } else {
        console.log('📝 Processing Type C individual question');
        // Q1-Q7 individual: move to next question immediately like Type A/B
        setIsAnswerSelected(true); // Mark as answered
        setTimeLeft(-1); // Stop the timer
        moveToNextQuestion(true, answer);
      }
    } else { // For Type A and Type B individual questions
      setIsAnswerSelected(true); // Mark as answered for Type A/B individual
      setTimeLeft(-1); // Stop the timer
      moveToNextQuestion(true, answer);
    }
  }, [currentPhase, questionData, moveToNextQuestion, isAnswerSelected, selectedAnswer]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      console.log('⏰ Timer expired, attempting to move to next question');
      // For Type C, if timer expires, save current answers and move.
      // For A/B, save empty answer and move.
      // Ensure Type C only moves if all questions are answered or timer expires.
      if (currentPhase === 'C' && Object.keys(selectedAnswer).length < QUESTION_LIMITS['C']) {
        console.warn('⏰ Type C timer expired, but not all questions in block were answered. Saving current answers and moving to next phase.');
        moveToNextQuestion(true, selectedAnswer); // Save partial answers and move
      } else {
        moveToNextQuestion(true, currentPhase === 'C' ? selectedAnswer : null);
      }
    }
    // If timeLeft is -1, do nothing (user has already selected an answer)
  }, [timeLeft, moveToNextQuestion, currentPhase, selectedAnswer, QUESTION_LIMITS]); // Added QUESTION_LIMITS to dependencies

  // Fetch question when phase or question number changes
  useEffect(() => {
    if (currentPhase && currentQuestion) {
      fetchQuestion(currentPhase, currentQuestion);
    }
  }, [currentPhase, currentQuestion, fetchQuestion]);

  // Check if user is logged in and handle admin jump (only once on mount)
  useEffect(() => {
    if (!userCode) {
      navigate('/login');
      return;
    }

    // Handle admin jump target only once
    const adminJumpTarget = sessionStorage.getItem('adminJumpTarget');
    if (adminJumpTarget) {
      console.log('🎯 Admin jump detected:', adminJumpTarget);
      
      // Clear the jump target immediately to prevent re-execution
      sessionStorage.removeItem('adminJumpTarget');
      
      if (adminJumpTarget === 'B') {
        console.log('🚀 Jumping to Type B, Question 1');
        setCurrentPhase('B');
        setCurrentQuestion(1);
        setTimeLeft(INITIAL_TIME_LIMITS['B']); // Set time for Type B
        // Immediately fetch Type B Question 1
        fetchQuestion('B', 1);
      } else if (adminJumpTarget === 'C') {
        console.log('🚀 Jumping to Type C, Question 1');
        setCurrentPhase('C');
        // setCurrentQuestion(1); // Removed for Type C as it's a block
        setTimeLeft(INITIAL_TIME_LIMITS['C']); // Set time for Type C
        // Immediately fetch Type C Question 1
        fetchQuestion('C', 1); // Still pass 1, backend ignores for Type C
      }
    }
  }, [fetchQuestion, navigate, userCode, INITIAL_TIME_LIMITS]); // Include dependencies

  // Calculate progress
  const getTotalProgress = () => {
    const phaseAProgress = currentPhase === 'A' ? currentQuestion : QUESTION_LIMITS.A;
    const phaseBProgress = currentPhase === 'B' ? currentQuestion : (currentPhase === 'C' ? QUESTION_LIMITS.B : 0);
    
    let phaseCProgress = 0;
    if (currentPhase === 'C') {
      if (questionData && questionData.is_block) {
        // Q8-Q10 block: 7 completed (Q1-Q7) + current block progress
        phaseCProgress = 7 + Object.keys(selectedAnswer).filter(key => selectedAnswer[key] !== '').length;
      } else {
        // Q1-Q7 individual: use current question number
        phaseCProgress = currentQuestion;
      }
    }
    
    const totalAnswered = phaseAProgress + phaseBProgress + phaseCProgress;
    const totalQuestions = QUESTION_LIMITS.A + QUESTION_LIMITS.B + QUESTION_LIMITS.C;
    
    return { totalAnswered, totalQuestions };
  };

  const { totalAnswered, totalQuestions } = getTotalProgress();

  // Render question based on type
  const renderQuestion = () => {
    if (isLoading) {
      return <div className="loading">문제를 불러오는 중...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (!questionData) {
      return <div className="error-message">문제 데이터를 불러올 수 없습니다.</div>;
    }

    if (currentPhase === 'A') {
      const typeAOptions = [
        { value: '5', text: '매우 그렇다' },
        { value: '4', text: '약간 그렇다' },
        { value: '3', text: '보통이다' },
        { value: '2', text: '약간 아니다' },
        { value: '1', text: '전혀 아니다' }
      ];

      return (
        <div className="question-content">
          <div className="question-text-center">
            <p>{questionData.question_text}</p>
          </div>
          <div className="answer-options">
            <div className="option-buttons">
              {typeAOptions.map(option => (
                <button 
                  key={option.value}
                  onClick={() => handleAnswerSelect(currentQuestion, option.value)} // Pass questionNum
                  className={`option-button ${selectedAnswer[currentQuestion] === option.value ? 'selected' : ''}`} // Use selectedAnswer[currentQuestion]
                  disabled={!!selectedAnswer[currentQuestion]} // Disable after selection for this question
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (currentPhase === 'B') {
      // Check if this is a Type B block question (Q8-Q9)
      if (questionData.is_block && questionData.questions) {
        // Render Q8-Q9 block with image and common passage
        return (
          <div className="question-content type-b-multi-question">
            {/* 이미지 */}
            {questionData.image_url && (
              <div className="question-image-container">
                <img src={questionData.image_url} alt="Type B Table" className="question-image" />
              </div>
            )}

            {/* 공통지문 */}
            {questionData.common_passage && (
              <div className="passage common-passage">
                <p><strong>공통 지문:</strong></p>
                <p>{questionData.common_passage}</p>
              </div>
            )}

            {/* 각 문제와 선택지 */}
            {questionData.questions.map(q => (
              <div key={`type-b-block-${q.problem_number}`} className="type-b-question-block">
                <div className="question-text">
                  <p><strong>문제 {q.problem_number}:</strong> {q.question_text}</p>
                  {q.passage && (
                    <div className="passage">
                      <p><strong>지문:</strong></p>
                      <p>{q.passage}</p>
                    </div>
                  )}
                </div>
                <div className="answer-options">
                  <div className="option-buttons">
                    {['A', 'B', 'C', 'D'].map(option => {
                      const optionKey = `option_${option.toLowerCase()}`;
                      const optionText = q[optionKey];
                      if (optionText) {
                        return (
                          <button 
                            key={`${q.problem_number}-${option}`}
                            onClick={() => handleAnswerSelect(q.problem_number, option)} 
                            className={`option-button ${selectedAnswer[q.problem_number] === option ? 'selected' : ''}`}
                            disabled={!!selectedAnswer[q.problem_number]}
                          >
                            {option}. {optionText}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      } else {
        // Render individual Type B questions (Q1-Q7)
        return (
          <div className="question-content">
            <div className="question-text">
              <p><strong>문제:</strong> {questionData.question_text}</p>
              {questionData.passage && (
                <div className="passage">
                  <p><strong>지문:</strong></p>
                  <p>{questionData.passage}</p>
                </div>
              )}
            </div>
            <div className="answer-options">
              <div className="option-buttons">
                {['A', 'B', 'C', 'D'].map(option => {
                  const optionKey = `option_${option.toLowerCase()}`;
                  const optionText = questionData[optionKey];
                  if (optionText) {
                    return (
                      <button 
                        key={option}
                        onClick={() => handleAnswerSelect(currentQuestion, option)} // Pass questionNum
                        className={`option-button ${selectedAnswer[currentQuestion] === option ? 'selected' : ''}`} // Use selectedAnswer[currentQuestion]
                        disabled={!!selectedAnswer[currentQuestion]} // Disable after selection for this question
                      >
                        {option}. {optionText}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        );
      }
    } else if (currentPhase === 'C') {
      const typeCOptions = ['A', 'B', 'C', 'D']; // Common options for Type C

      // Check if this is a block question (Q8-Q10 with common images)
      if (questionData.is_block && questionData.questions) {
        // Render Q8-Q10 block with common images (P1, P2)
        return (
          <div className="question-content type-c-multi-question">
            {questionData.common_images && questionData.common_images.map((imageUrl, index) => (
              <div key={`common-image-${index}`} className="common-image-container">
                <img src={imageUrl} alt={`Common Passage ${index + 1}`} className="common-image" />
              </div>
            ))}

            {questionData.questions.map(q => (
              <div key={`q-block-${q.problem_number}`} className="type-c-question-block">
                <div className="question-text">
                  <p>Type C 문제 #{q.problem_number}</p>
                  {q.image_url && (
                    <div className="question-image-container">
                      <img src={q.image_url} alt={`Type C Question ${q.problem_number}`} className="question-image" />
                    </div>
                  )}
                </div>
                <div className="answer-options">
                  <div className="option-buttons">
                    {typeCOptions.map(option => (
                      <button 
                        key={`${q.problem_number}-${option}`}
                        onClick={() => handleAnswerSelect(q.problem_number, option)} 
                        className={`option-button ${selectedAnswer[q.problem_number] === option ? 'selected' : ''}`}
                        disabled={!!selectedAnswer[q.problem_number]}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      } else {
        // Render Q1-Q7 individually like Type A/B
        return (
          <div className="question-content">
            <div className="question-text">
              <p><strong>Type C 문제 #{currentQuestion}</strong></p>
              {questionData.image_url && (
                <div className="question-image-container">
                  <img src={questionData.image_url} alt={`Type C Question ${currentQuestion}`} className="question-image" />
                </div>
              )}
            </div>
            <div className="answer-options">
              <div className="option-buttons">
                {typeCOptions.map(option => (
                  <button 
                    key={option}
                    onClick={() => handleAnswerSelect(currentQuestion, option)} 
                    className={`option-button ${selectedAnswer[currentQuestion] === option ? 'selected' : ''}`}
                    disabled={!!selectedAnswer[currentQuestion]}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="test-page">
      <div className="test-container">
        <div className="test-header">
          <div className="progress-info">
            <div className="current-phase">
              현재: Type {currentPhase} - {currentPhase === 'C' ? 
                (questionData && questionData.is_block ? 
                  `${Math.max(8, Object.keys(selectedAnswer).filter(key => selectedAnswer[key] !== '').length + 7)}/10` : 
                  `${currentQuestion}/10`) : 
                `${currentQuestion}/${QUESTION_LIMITS[currentPhase]}`}
            </div>
            <div className="total-progress">
              전체 진행률: {totalAnswered}/{totalQuestions} ({Math.round((totalAnswered/totalQuestions)*100)}%)
            </div>
          </div>
        </div>

        <div className="question-section">
          {renderQuestion()}
        </div>

        <div className="timer-section-bottom">
          <div className={`timer-bottom ${timeLeft <= 3 && timeLeft > 0 ? 'timer-warning' : ''}`}>
            {timeLeft === -1 ? '답안 저장 중...' : `남은 시간: ${timeLeft}초`}
          </div>
        </div>

        <div className="test-footer">
          <p className="instruction">
            시간 내에 답을 선택하거나, 시간이 끝나면 자동으로 다음 문제로 넘어갑니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TestPage;

const express = require('express');
const cors = require('cors');
const models = require('./models');
const path = require('path'); // Add path module
const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to extract surveyType and attach dynamic DB
app.use((req, res, next) => {
  // surveyType can come from body, query, or header
  const surveyType = req.body?.surveyType || req.query?.surveyType || req.headers['x-survey-type'] || 'v1';
  
  console.log(`🔍 Request to ${req.path} with surveyType: ${surveyType}`);
  
  // Attach dynamic DB to request
  req.dynamicModels = models.createDynamicDB(surveyType);
  req.surveyType = surveyType;
  
  next();
});

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, '../../client/build')));

// Serve images from public directory
app.use('/images', express.static(path.join(__dirname, '../../public/images')));

// Test route to get all problems from Type A
app.get('/api/problems/a', async (req, res) => {
  try {
    const problems = await models.ProblemV1TypeA.findAll();
    res.json(problems);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error fetching problems from Type A' });
  }
});

// Test route to get all codes
app.get('/api/codes', async (req, res) => {
  try {
    const codes = await models.Code.findAll();
    res.json(codes);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error fetching codes' });
  }
});

// User info storage API endpoint
app.post('/api/user/info', async (req, res) => {
  const { user_name, school, grade, gender, region, b_grade_subjects_count, desired_high_school, student_phone, parent_phone, code } = req.body;

  if (!user_name || !school || !grade || !gender || !region || b_grade_subjects_count === undefined || !desired_high_school || !student_phone || !parent_phone || !code) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Store user info in report_v1 table using dynamic models
    const dynamicModels = req.dynamicModels;
    const userInfo = await dynamicModels.ReportV1.create({
      user_name: user_name,
      user_code: code,
      school: school,
      grade: parseInt(grade),
      gender: gender,
      region: region,
      b_grade_subjects_count: parseInt(b_grade_subjects_count),
      desired_high_school: desired_high_school,
      student_phone: student_phone,
      parent_phone: parent_phone,
      // score: 0 // Initial score, will be updated after test completion - REMOVED
    });

    res.status(200).json({ 
      message: 'User information saved successfully!',
      userInfoId: userInfo.report_id
    });

  } catch (error) {
    console.error('Error saving user info:', error);
    res.status(500).json({ message: 'An error occurred while saving user information.' });
  }
});

// Get specific question by type and number
app.get('/api/test/question/:type/:number', async (req, res) => {
  const { type, number } = req.params;
  
  if (!['A', 'B', 'C'].includes(type.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid question type. Must be A, B, or C.' });
  }

  const questionNumber = parseInt(number);
  if (isNaN(questionNumber) || questionNumber < 1) {
    return res.status(400).json({ message: 'Invalid question number.' });
  }

  console.log(`🔍 Fetching question from database: ${req.surveyType}`);

  try {
    let question;
    const upperType = type.toUpperCase();
    // Use dynamic models instead of static models
    const dynamicModels = req.dynamicModels;
    
    console.log(`🔍 Dynamic models available:`, Object.keys(dynamicModels));
    console.log(`🔍 ProblemV1TypeB model exists:`, !!dynamicModels.ProblemV1TypeB);

    if (upperType === 'A') {
      question = await dynamicModels.ProblemV1TypeA.findOne({
        where: { problem_number: questionNumber }
      });
    } else if (upperType === 'B') {
      if (questionNumber <= 7) {
        // For Q1-Q7, return individual questions
        question = await dynamicModels.ProblemV1TypeB.findOne({
          where: { problem_number: questionNumber }
        });
      } else if (questionNumber === 8) {
        // For Q8, return Q8-Q9 as a block with common passage and image
        const questionsB = await dynamicModels.ProblemV1TypeB.findAll({
          where: { problem_number: [8, 9] },
          order: [['problem_number', 'ASC']]
        });

        if (questionsB.length === 0) {
          return res.status(404).json({ message: 'Type B questions (Q8-Q9) not found.' });
        }

        const responseData = {
          question_type: upperType,
          is_block: true, // Flag to indicate this is a block of questions
          common_passage: questionsB[0].common_passage, // Use common passage from Q8
          image_url: `/images/typeB/Table_I.jpg`,
          questions: questionsB.map(q => {
            const { correct_answer, common_passage, ...qData } = q.toJSON();
            return qData;
          })
        };
        return res.json(responseData);
      } else if (questionNumber === 9) {
        return res.status(400).json({ message: 'Q9 is accessed via Q8 as a block.' });
      } else if (questionNumber === 10) {
        // For Q10, return individual question
        question = await dynamicModels.ProblemV1TypeB.findOne({
          where: { problem_number: questionNumber }
        });
      } else {
        return res.status(400).json({ message: 'Invalid question number for Type B. Must be 1-10, but Q9 is accessed via Q8.' });
      }
    } else if (upperType === 'C') {
      if (questionNumber <= 7) {
        // For Q1-Q7, return individual questions like Type A/B
        question = await dynamicModels.ProblemV1TypeC.findOne({
          where: { problem_number: questionNumber }
        });
        
        if (!question) {
          return res.status(404).json({ message: `Type C Question ${questionNumber} not found.` });
        }

        const { correct_answer, ...questionData } = question.toJSON();
        return res.json({
          ...questionData,
          question_type: upperType,
          image_url: `/images/typeC/Q${questionNumber}.jpg`
        });
      } else if (questionNumber === 8) {
        // For Q8, return Q8-Q10 as a block with common images
        const questionsC = await dynamicModels.ProblemV1TypeC.findAll({
          where: { problem_number: [8, 9, 10] },
          order: [['problem_number', 'ASC']]
        });

        if (questionsC.length === 0) {
          return res.status(404).json({ message: 'Type C questions (Q8-Q10) not found.' });
        }

        const responseData = {
          question_type: upperType,
          is_block: true, // Flag to indicate this is a block of questions
          common_images: [
            `/images/typeC/P1.jpg`,
            `/images/typeC/P2.jpg`
          ],
          questions: questionsC.map(q => {
            const { correct_answer, ...qData } = q.toJSON();
            return {
              ...qData,
              image_url: `/images/typeC/Q${q.problem_number}.jpg`
            };
          })
        };
        return res.json(responseData);
      } else {
        return res.status(400).json({ message: 'Invalid question number for Type C. Must be 1-10, but Q8-Q10 are accessed via Q8.' });
      }
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    // Don't send the correct_answer to the client
    const { correct_answer, ...questionData } = question.toJSON();
    
    // If it's a Type C question, add the image URL
    if (upperType === 'C') { // This block is now redundant for Type C, but kept for other types if logic changes
      // Construct the full URL for the image
      questionData.image_url = `/images/typeC/Q${questionNumber}.jpg`; // Assuming image names are Q1.jpg, Q2.jpg, etc.
    }

    res.json({
      ...questionData,
      question_type: upperType
    });

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'An error occurred while fetching the question.' });
  }
});

// Save user answer (efficient version)
app.post('/api/test/answer', async (req, res) => {
  const { user_code, question_type, question_number, selected_answer } = req.body;

  console.log('🔍 Answer save request:', {
    user_code,
    question_type,
    question_number,
    selected_answer,
    timestamp: new Date().toISOString()
  });

  if (!user_code || !question_type) {
    return res.status(400).json({ message: 'user_code and question_type are required.' });
  }
  
  // For Type C blocks and Type B blocks, question_number can be null
  const isTypeCBlock = question_type.toUpperCase() === 'C' && question_number === null;
  const isTypeBBlock = question_type.toUpperCase() === 'B' && question_number === null;
  if (!question_number && !isTypeCBlock && !isTypeBBlock) {
    return res.status(400).json({ message: 'question_number is required for non-block questions.' });
  }

  if (!['A', 'B', 'C'].includes(question_type.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid question_type. Must be A, B, or C.' });
  }

  try {
    const upperType = question_type.toUpperCase();
    
    console.log('📊 Processing:', { question_number, upperType, selected_answer });
    
    // Use dynamic models for database operations
    const dynamicModels = req.dynamicModels;
    
    // Find or create user answers record
    let userAnswers = await dynamicModels.UserAnswers.findOne({
      where: { user_code: user_code }
    });

    console.log('👤 User record found:', !!userAnswers);

    if (!userAnswers) {
      console.log('➕ Creating new user answers record');
      userAnswers = await dynamicModels.UserAnswers.create({
        user_code: user_code,
        type_a_answers: '[]',
        type_b_answers: '[]',
        type_c_answers: '[]'
      });
      console.log('✅ New record created:', userAnswers.id);
    }

    let updateData = {};
    let totalAnswered = 0;

    if (upperType === 'C') {
      let typeCAnswersArray = [];
      try {
        typeCAnswersArray = JSON.parse(userAnswers.type_c_answers || '[]');
      } catch (parseError) {
        console.warn('⚠️ Failed to parse existing type_c_answers, starting fresh:', parseError);
        typeCAnswersArray = [];
      }

      // Ensure array is large enough to hold answers up to Q10 (max problem_number for Type C)
      const maxProblemNumberC = 10; // Q1 to Q10
      while (typeCAnswersArray.length < maxProblemNumberC) {
        typeCAnswersArray.push(null);
      }

      if (isTypeCBlock && typeof selected_answer === 'object') {
        // For Type C block (Q8-Q10): selected_answer is an object {qNum: answer}
        console.log('📦 Processing Type C block answers:', selected_answer);
        for (const qNum in selected_answer) {
          const arrayIndex = parseInt(qNum) - 1; // Convert problem_number to 0-based index
          if (arrayIndex >= 0 && arrayIndex < maxProblemNumberC) {
            typeCAnswersArray[arrayIndex] = selected_answer[qNum] || null;
            console.log(`🔄 Updated Type C index ${arrayIndex} (Q${qNum}): "${typeCAnswersArray[arrayIndex]}"`);
          }
        }
      } else {
        // For Type C individual (Q1-Q7): selected_answer is a string, question_number is provided
        console.log('📋 Processing Type C individual answer:', { question_number, selected_answer });
        const questionNum = parseInt(question_number);
        const arrayIndex = questionNum - 1; // Convert problem_number to 0-based index
        if (arrayIndex >= 0 && arrayIndex < maxProblemNumberC) {
          typeCAnswersArray[arrayIndex] = selected_answer || null;
          console.log(`🔄 Updated Type C index ${arrayIndex} (Q${questionNum}): "${typeCAnswersArray[arrayIndex]}"`);
        }
      }
      updateData.type_c_answers = JSON.stringify(typeCAnswersArray);

    } else if (upperType === 'B' && isTypeBBlock && typeof selected_answer === 'object') {
      // For Type B block (Q8-Q9): selected_answer is an object {qNum: answer}
      console.log('📦 Processing Type B block answers:', selected_answer);
      
      let typeBAnswersArray = [];
      try {
        typeBAnswersArray = JSON.parse(userAnswers.type_b_answers || '[]');
      } catch (parseError) {
        console.warn('⚠️ Failed to parse existing type_b_answers, starting fresh:', parseError);
        typeBAnswersArray = [];
      }

      // Ensure array is large enough to hold answers up to Q10 (max problem_number for Type B)
      const maxProblemNumberB = 10; // Q1 to Q10
      while (typeBAnswersArray.length < maxProblemNumberB) {
        typeBAnswersArray.push(null);
      }

      for (const qNum in selected_answer) {
        const arrayIndex = parseInt(qNum) - 1; // Convert problem_number to 0-based index
        if (arrayIndex >= 0 && arrayIndex < maxProblemNumberB) {
          typeBAnswersArray[arrayIndex] = selected_answer[qNum] || null;
          console.log(`🔄 Updated Type B index ${arrayIndex} (Q${qNum}): "${typeBAnswersArray[arrayIndex]}"`);
        }
      }
      updateData.type_b_answers = JSON.stringify(typeBAnswersArray);

    } else {
      // For Type A/B, selected_answer is a single string
      const questionNum = parseInt(question_number);
      const fieldName = `type_${upperType.toLowerCase()}_answers`;
      
      let answersArray = [];
      try {
        answersArray = JSON.parse(userAnswers[fieldName] || '[]');
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse existing ${fieldName}, starting fresh:`, parseError);
        answersArray = [];
      }

      // Ensure array is large enough (pad with null values if needed)
      const currentLimit = upperType === 'A' ? 240 : 10; // Max questions for A or B
      while (answersArray.length < currentLimit) {
        answersArray.push(null);
      }
      
      // Update the specific question's answer (1-based indexing, so subtract 1)
      const arrayIndex = questionNum - 1;
      answersArray[arrayIndex] = selected_answer || null;
      
      updateData[fieldName] = JSON.stringify(answersArray);
    }

    // Recalculate total questions answered (count non-null values across all types)
    // This needs to be done after updating the current type's answers.
    let currentTotalAnswered = 0;
    try {
      const typeAAnswers = JSON.parse(userAnswers.type_a_answers || '[]');
      currentTotalAnswered += typeAAnswers.filter(ans => ans !== null).length;
    } catch (e) { console.warn('Error parsing type_a_answers for total:', e); }
    
    try {
      const typeBAnswers = JSON.parse(userAnswers.type_b_answers || '[]');
      currentTotalAnswered += typeBAnswers.filter(ans => ans !== null).length;
    } catch (e) { console.warn('Error parsing type_b_answers for total:', e); }
    
    try {
      const typeCAnswers = JSON.parse(userAnswers.type_c_answers || '[]');
      currentTotalAnswered += typeCAnswers.filter(ans => ans !== null).length;
    } catch (e) { console.warn('Error parsing type_c_answers for total:', e); }

    updateData.total_questions_answered = currentTotalAnswered;
    updateData.last_updated = new Date();

    console.log('💾 Update data:', updateData);

    await userAnswers.update(updateData);
    
    console.log('✅ Database updated successfully');
    console.log('📈 Total questions answered:', currentTotalAnswered);

    res.status(200).json({ 
      message: 'Answer saved successfully!',
      debug: {
        question_number, // Original question_number (null for Type C)
        upperType,
        selected_answer, // Original selected_answer (object for Type C)
        totalAnswered: currentTotalAnswered
      }
    });

  } catch (error) {
    console.error('❌ Error saving answer:', error);
    res.status(500).json({ message: 'An error occurred while saving the answer.' });
  }
});

// Complete test
app.post('/api/test/complete', async (req, res) => {
  const { user_code } = req.body;

  if (!user_code) {
    return res.status(400).json({ message: 'user_code is required.' });
  }

  try {
    // Use dynamic models for database operations
    const dynamicModels = req.dynamicModels;
    
    // Mark the code as used (use dynamic models for consistency with surveyType)
    await dynamicModels.Code.update(
      { is_used: true },
      { where: { code_value: user_code } }
    );

    // Update test completion timestamp
    const userAnswers = await dynamicModels.UserAnswers.findOne({
      where: { user_code: user_code }
    });

    let totalAnswered = 0;
    if (userAnswers) {
      await userAnswers.update({
        test_completed_at: new Date(),
        last_updated: new Date()
      });
      totalAnswered = userAnswers.total_questions_answered;
    }

    // Update the user's score in report_v1 table
    const reportEntry = await dynamicModels.ReportV1.findOne({
      where: { user_code: user_code }
    });

    if (reportEntry) {
      // report_v1 테이블에 score 컬럼이 없으므로, score 업데이트 로직 제거
      // await reportEntry.update({ score: totalAnswered }); 
    } else {
      console.warn(`No report entry found for user_code: ${user_code}. Score not updated.`);
    }

    res.status(200).json({ 
      message: 'Test completed successfully!',
      totalAnswered: totalAnswered,
      score: totalAnswered // score는 더 이상 DB에 저장되지 않지만, 응답에는 포함
    });

  } catch (error) {
    console.error('Detailed error on complete:', error.original || error);
    res.status(500).json({ message: 'An error occurred while completing the test.' });
  }
});

// Login API endpoint
app.post('/api/auth/login', async (req, res) => {
  const { name, code, surveyType } = req.body;

  if (!name || !code || !surveyType) {
    return res.status(400).json({ message: 'Name, code, and surveyType are required.' });
  }

  console.log('🔍 Login request received:', { name, code, surveyType });

  // Store surveyType in a way that can be accessed by other endpoints
  // For now, we'll use a session-like approach with a global variable
  // In production, you'd want to use proper session management
  req.surveyType = surveyType;

  try {
    // Check if it's the admin code
    if (code === 'ADM0000') {
      // Admin login always succeeds for testing purposes (but still need valid surveyType)
      try {
        // Test if the dynamic DB exists for this surveyType
        const testConnection = req.dynamicModels;
        if (!testConnection) {
          return res.status(400).json({ 
            message: '선택하신 검사 유형이 존재하지 않습니다. 다른 검사 유형을 선택해주세요.' 
          });
        }
      } catch (dbError) {
        console.error('DB connection error for surveyType:', surveyType, dbError);
        return res.status(400).json({ 
          message: '선택하신 검사 유형이 존재하지 않습니다. 다른 검사 유형을 선택해주세요.' 
        });
      }
      return res.status(200).json({ message: 'Admin login successful!', isAdmin: true });
    }

    // For regular users, check if the code exists and is not used using dynamic models
    let foundCode;
    try {
      foundCode = await req.dynamicModels.Code.findOne({ where: { code_value: code } });
    } catch (dbError) {
      console.error('Database connection error for surveyType:', surveyType, dbError);
      return res.status(400).json({ 
        message: '선택하신 검사 유형이 존재하지 않습니다. 다른 검사 유형을 선택해주세요.' 
      });
    }

    if (!foundCode) {
      return res.status(401).json({ message: 'Invalid code.' });
    }

    if (foundCode.is_used) {
      return res.status(401).json({ message: 'This code has already been used.' });
    }

    // If code is valid and not used, login successful (for now, we don't mark as used here)
    // In a real app, you might mark it as used after test completion or session start
    res.status(200).json({ message: 'Login successful!', isAdmin: false });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

// Admin test functions
app.post('/api/admin/jump-to-phase', async (req, res) => {
  const { user_code, target_phase } = req.body;

  if (!user_code || !target_phase) {
    return res.status(400).json({ message: 'user_code and target_phase are required.' });
  }

  if (!['B', 'C', 'COMPLETE'].includes(target_phase.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid target_phase. Must be B, C, or COMPLETE.' });
  }

  try {
    const upperPhase = target_phase.toUpperCase();
    
    // Generate random correct answers based on target phase
    const generateRandomAnswers = (type, count) => {
      const answers = [];
      for (let i = 1; i <= count; i++) {
        if (type === 'A') {
          // Type A: 1-5 scale, generate random number
          answers.push(String(Math.floor(Math.random() * 5) + 1));
        } else {
          // Type B, C: A,B,C,D options, generate random letter
          const options = ['A', 'B', 'C', 'D'];
          answers.push(options[Math.floor(Math.random() * 4)]);
        }
      }
      return answers;
    };

    // Use dynamic models for database operations
    const dynamicModels = req.dynamicModels;
    
    // Find or create user answers record
    let userAnswers = await dynamicModels.UserAnswers.findOne({
      where: { user_code: user_code }
    });

    if (!userAnswers) {
      userAnswers = await dynamicModels.UserAnswers.create({
        user_code: user_code,
        type_a_answers: '[]',
        type_b_answers: '[]',
        type_c_answers: '[]'
      });
    }

    let updateData = {};
    let totalAnswered = 0;

    if (upperPhase === 'B') {
      // Fill Type A with random answers
      const typeAAnswers = generateRandomAnswers('A', 240);
      updateData.type_a_answers = JSON.stringify(typeAAnswers);
      totalAnswered = 240;
    } else if (upperPhase === 'C') {
      // Fill Type A and B with random answers
      const typeAAnswers = generateRandomAnswers('A', 240);
      const typeBAnswers = generateRandomAnswers('B', 10);
      updateData.type_a_answers = JSON.stringify(typeAAnswers);
      updateData.type_b_answers = JSON.stringify(typeBAnswers);
      totalAnswered = 250;
    } else if (upperPhase === 'COMPLETE') {
      // Fill all types with random answers
      const typeAAnswers = generateRandomAnswers('A', 240);
      const typeBAnswers = generateRandomAnswers('B', 10);
      const typeCAnswers = generateRandomAnswers('C', 10);
      updateData.type_a_answers = JSON.stringify(typeAAnswers);
      updateData.type_b_answers = JSON.stringify(typeBAnswers);
      updateData.type_c_answers = JSON.stringify(typeCAnswers);
      updateData.test_completed_at = new Date();
      totalAnswered = 260;
    }

    updateData.total_questions_answered = totalAnswered;
    updateData.last_updated = new Date();

    await userAnswers.update(updateData);

    // If completing, also mark code as used and update report
    if (upperPhase === 'COMPLETE') {
      await dynamicModels.Code.update( // dynamicModels 사용
        { is_used: true },
        { where: { code_value: user_code } }
      );

      const reportEntry = await dynamicModels.ReportV1.findOne({ // dynamicModels 사용
        where: { user_code: user_code }
      });

      if (reportEntry) {
        // report_v1 테이블에 score 컬럼이 없으므로, score 업데이트 로직 제거
        // await reportEntry.update({ score: totalAnswered }); 
      }
    }

    res.status(200).json({ 
      message: `Successfully jumped to ${upperPhase}!`,
      totalAnswered: totalAnswered,
      targetPhase: upperPhase
    });

  } catch (error) {
    console.error('Detailed error in admin jump-to-phase:', error.original || error);
    res.status(500).json({ message: 'An error occurred while processing admin request.' });
  }
});

app.get('/api/hello', (req, res) => {
  res.send({ message: 'Hello From Express' });
});

// Catch-all handler: serve React app for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../../client/build', 'index.html');
  
  // Check if React build file exists
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback response when React build is not available
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SSL 적성검사 시스템</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .container { max-width: 600px; margin: 0 auto; }
          .status { color: #28a745; font-size: 18px; margin-bottom: 20px; }
          .info { color: #666; line-height: 1.6; }
          .api-link { color: #007bff; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 SSL 적성검사 시스템</h1>
          <div class="status">✅ 서버가 성공적으로 실행 중입니다!</div>
          <div class="info">
            <p>백엔드 API 서버가 정상적으로 작동하고 있습니다.</p>
            <p>환경변수: 모두 로드됨 ✅</p>
            <p>데이터베이스: 연결됨 ✅</p>
            <p>API 엔드포인트: 활성화됨 ✅</p>
            <br>
            <p>API 테스트: <a href="/api/hello" class="api-link">/api/hello</a></p>
            <p>코드 조회: <a href="/api/codes" class="api-link">/api/codes</a></p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// Sync database and start server
models.sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
});

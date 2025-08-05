const models = require('../../lib/models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user_code, question_type, question_number, selected_answer } = req.body;

  if (!user_code || !question_type) {
    return res.status(400).json({ message: 'user_code and question_type are required.' });
  }
  
  if (!['A', 'B', 'C'].includes(question_type.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid question_type. Must be A, B, or C.' });
  }

  try {
    // Get surveyType from request or default to 'v1'
    const surveyType = req.body?.surveyType || req.query?.surveyType || req.headers['x-survey-type'] || 'v1';
    
    // Get dynamic models for the survey type
    const dynamicModels = models.createDynamicDB(surveyType);
    
    const upperType = question_type.toUpperCase();
    
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

    if (upperType === 'C') {
      let typeCAnswersArray = [];
      try {
        typeCAnswersArray = JSON.parse(userAnswers.type_c_answers || '[]');
      } catch (parseError) {
        typeCAnswersArray = [];
      }

      const maxProblemNumberC = 10;
      while (typeCAnswersArray.length < maxProblemNumberC) {
        typeCAnswersArray.push(null);
      }

      const isTypeCBlock = question_number === null;
      if (isTypeCBlock && typeof selected_answer === 'object') {
        for (const qNum in selected_answer) {
          const arrayIndex = parseInt(qNum) - 1;
          if (arrayIndex >= 0 && arrayIndex < maxProblemNumberC) {
            typeCAnswersArray[arrayIndex] = selected_answer[qNum] || null;
          }
        }
      } else {
        const questionNum = parseInt(question_number);
        const arrayIndex = questionNum - 1;
        if (arrayIndex >= 0 && arrayIndex < maxProblemNumberC) {
          typeCAnswersArray[arrayIndex] = selected_answer || null;
        }
      }
      updateData.type_c_answers = JSON.stringify(typeCAnswersArray);

    } else if (upperType === 'B' && question_number === null && typeof selected_answer === 'object') {
      let typeBAnswersArray = [];
      try {
        typeBAnswersArray = JSON.parse(userAnswers.type_b_answers || '[]');
      } catch (parseError) {
        typeBAnswersArray = [];
      }

      const maxProblemNumberB = 10;
      while (typeBAnswersArray.length < maxProblemNumberB) {
        typeBAnswersArray.push(null);
      }

      for (const qNum in selected_answer) {
        const arrayIndex = parseInt(qNum) - 1;
        if (arrayIndex >= 0 && arrayIndex < maxProblemNumberB) {
          typeBAnswersArray[arrayIndex] = selected_answer[qNum] || null;
        }
      }
      updateData.type_b_answers = JSON.stringify(typeBAnswersArray);

    } else {
      const questionNum = parseInt(question_number);
      const fieldName = `type_${upperType.toLowerCase()}_answers`;
      
      let answersArray = [];
      try {
        answersArray = JSON.parse(userAnswers[fieldName] || '[]');
      } catch (parseError) {
        answersArray = [];
      }

      const currentLimit = upperType === 'A' ? 240 : 10;
      while (answersArray.length < currentLimit) {
        answersArray.push(null);
      }
      
      const arrayIndex = questionNum - 1;
      answersArray[arrayIndex] = selected_answer || null;
      
      updateData[fieldName] = JSON.stringify(answersArray);
    }

    // Recalculate total questions answered
    let currentTotalAnswered = 0;
    try {
      const typeAAnswers = JSON.parse(userAnswers.type_a_answers || '[]');
      currentTotalAnswered += typeAAnswers.filter(ans => ans !== null).length;
    } catch (e) { }
    
    try {
      const typeBAnswers = JSON.parse(userAnswers.type_b_answers || '[]');
      currentTotalAnswered += typeBAnswers.filter(ans => ans !== null).length;
    } catch (e) { }
    
    try {
      const typeCAnswers = JSON.parse(userAnswers.type_c_answers || '[]');
      currentTotalAnswered += typeCAnswers.filter(ans => ans !== null).length;
    } catch (e) { }

    updateData.total_questions_answered = currentTotalAnswered;
    updateData.last_updated = new Date();

    await userAnswers.update(updateData);

    res.status(200).json({ 
      message: 'Answer saved successfully!',
      debug: {
        question_number,
        upperType,
        selected_answer,
        totalAnswered: currentTotalAnswered
      }
    });

  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ message: 'An error occurred while saving the answer.' });
  }
}

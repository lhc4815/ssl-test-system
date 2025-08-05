const models = require('../../lib/models');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, number } = req.query;
  
  if (!['A', 'B', 'C'].includes(type?.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid question type. Must be A, B, or C.' });
  }

  const questionNumber = parseInt(number);
  if (isNaN(questionNumber) || questionNumber < 1) {
    return res.status(400).json({ message: 'Invalid question number.' });
  }

  try {
    // Get surveyType from request or default to 'v1'
    const surveyType = req.body?.surveyType || req.query?.surveyType || req.headers['x-survey-type'] || 'v1';
    
    // Get dynamic models for the survey type
    const dynamicModels = models.createDynamicDB(surveyType);
    
    console.log(`🔍 Fetching question from database: ${surveyType}`);

    let question;
    const upperType = type.toUpperCase();
    const baseUrl = `https://${req.headers.host}`;

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
          is_block: true,
          common_passage: questionsB[0].common_passage,
          image_url: `${baseUrl}/images/typeB/Table_I.jpg`,
          questions: questionsB.map(q => {
            const { correct_answer, common_passage, ...qData } = q.toJSON();
            return qData;
          })
        };
        return res.json(responseData);
      } else if (questionNumber === 9) {
        return res.status(400).json({ message: 'Q9 is accessed via Q8 as a block.' });
      } else if (questionNumber === 10) {
        question = await dynamicModels.ProblemV1TypeB.findOne({
          where: { problem_number: questionNumber }
        });
      } else {
        return res.status(400).json({ message: 'Invalid question number for Type B. Must be 1-10, but Q9 is accessed via Q8.' });
      }
    } else if (upperType === 'C') {
      if (questionNumber <= 7) {
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
          image_url: `${baseUrl}/images/typeC/Q${questionNumber}.jpg`
        });
      } else if (questionNumber === 8) {
        const questionsC = await dynamicModels.ProblemV1TypeC.findAll({
          where: { problem_number: [8, 9, 10] },
          order: [['problem_number', 'ASC']]
        });

        if (questionsC.length === 0) {
          return res.status(404).json({ message: 'Type C questions (Q8-Q10) not found.' });
        }

        const responseData = {
          question_type: upperType,
          is_block: true,
          common_images: [
            `${baseUrl}/images/typeC/P1.jpg`,
            `${baseUrl}/images/typeC/P2.jpg`
          ],
          questions: questionsC.map(q => {
            const { correct_answer, ...qData } = q.toJSON();
            return {
              ...qData,
              image_url: `${baseUrl}/images/typeC/Q${q.problem_number}.jpg`
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
    if (upperType === 'C') {
      questionData.image_url = `${baseUrl}/images/typeC/Q${questionNumber}.jpg`;
    }

    res.json({
      ...questionData,
      question_type: upperType
    });

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'An error occurred while fetching the question.' });
  }
}

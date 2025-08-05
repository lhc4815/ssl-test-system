const models = require('../../lib/models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user_code, target_phase } = req.body;

  if (!user_code || !target_phase) {
    return res.status(400).json({ message: 'user_code and target_phase are required.' });
  }

  if (!['B', 'C', 'COMPLETE'].includes(target_phase.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid target_phase. Must be B, C, or COMPLETE.' });
  }

  try {
    // Get surveyType from request or default to 'v1'
    const surveyType = req.body?.surveyType || req.query?.surveyType || req.headers['x-survey-type'] || 'v1';
    
    // Get dynamic models for the survey type
    const dynamicModels = models.createDynamicDB(surveyType);
    
    const upperPhase = target_phase.toUpperCase();
    
    // Generate random correct answers based on target phase
    const generateRandomAnswers = (type, count) => {
      const answers = [];
      for (let i = 1; i <= count; i++) {
        if (type === 'A') {
          answers.push(String(Math.floor(Math.random() * 5) + 1));
        } else {
          const options = ['A', 'B', 'C', 'D'];
          answers.push(options[Math.floor(Math.random() * 4)]);
        }
      }
      return answers;
    };
    
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
      const typeAAnswers = generateRandomAnswers('A', 240);
      updateData.type_a_answers = JSON.stringify(typeAAnswers);
      totalAnswered = 240;
    } else if (upperPhase === 'C') {
      const typeAAnswers = generateRandomAnswers('A', 240);
      const typeBAnswers = generateRandomAnswers('B', 10);
      updateData.type_a_answers = JSON.stringify(typeAAnswers);
      updateData.type_b_answers = JSON.stringify(typeBAnswers);
      totalAnswered = 250;
    } else if (upperPhase === 'COMPLETE') {
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
      await models.Code.update(
        { is_used: true },
        { where: { code_value: user_code } }
      );

      const reportEntry = await dynamicModels.ReportV1.findOne({
        where: { user_code: user_code }
      });

      if (reportEntry) {
        await reportEntry.update({ score: totalAnswered });
      }
    }

    res.status(200).json({ 
      message: `Successfully jumped to ${upperPhase}!`,
      totalAnswered: totalAnswered,
      targetPhase: upperPhase
    });

  } catch (error) {
    console.error('Error in admin jump-to-phase:', error);
    res.status(500).json({ message: 'An error occurred while processing admin request.' });
  }
}

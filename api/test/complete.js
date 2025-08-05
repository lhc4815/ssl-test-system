const models = require('../lib/models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user_code } = req.body;

  if (!user_code) {
    return res.status(400).json({ message: 'user_code is required.' });
  }

  try {
    // Get surveyType from request or default to 'v1'
    const surveyType = req.body?.surveyType || req.query?.surveyType || req.headers['x-survey-type'] || 'v1';
    
    // Get dynamic models for the survey type
    const dynamicModels = models.createDynamicDB(surveyType);
    
    // Mark the code as used (this is global, so use static models)
    await models.Code.update(
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
      await reportEntry.update({ score: totalAnswered });
    }

    res.status(200).json({ 
      message: 'Test completed successfully!',
      totalAnswered: totalAnswered,
      score: totalAnswered
    });

  } catch (error) {
    console.error('Error completing test:', error);
    res.status(500).json({ message: 'An error occurred while completing the test.' });
  }
}

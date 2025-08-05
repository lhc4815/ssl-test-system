const models = require('../../lib/models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user_name, school, grade, gender, region, b_grade_subjects_count, desired_high_school, student_phone, parent_phone, code } = req.body;

  if (!user_name || !school || !grade || !gender || !region || b_grade_subjects_count === undefined || !desired_high_school || !student_phone || !parent_phone || !code) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Get surveyType from request or default to 'v1'
    const surveyType = req.body?.surveyType || req.query?.surveyType || req.headers['x-survey-type'] || 'v1';
    
    // Get dynamic models for the survey type
    const dynamicModels = models.createDynamicDB(surveyType);
    
    // Store user info in report_v1 table using dynamic models
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
      score: 0 // Initial score, will be updated after test completion
    });

    res.status(200).json({ 
      message: 'User information saved successfully!',
      userInfoId: userInfo.report_id
    });

  } catch (error) {
    console.error('Error saving user info:', error);
    res.status(500).json({ message: 'An error occurred while saving user information.' });
  }
}

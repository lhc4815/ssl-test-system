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
    const upperType = type.toUpperCase();
    console.log(`🔍 Fetching sample question: Type ${upperType}, Question ${questionNumber}`);

    // Return sample questions for testing
    if (upperType === 'A') {
      return res.json({
        problem_number: questionNumber,
        category_main: "언어능력",
        category_sub: "어휘력",
        question_text: `이는 Type A 테스트 문항 ${questionNumber}번입니다. 다음 중 가장 적절한 답을 고르세요.`,
        question_type: 'A'
      });
    } else if (upperType === 'B') {
      return res.json({
        problem_number: questionNumber,
        question_text: `Type B 문항 ${questionNumber}번: 다음 지문을 읽고 물음에 답하세요.`,
        passage: "이것은 샘플 지문입니다. 실제 시험에서는 여기에 긴 지문이 나타납니다.",
        option_a: "선택지 A",
        option_b: "선택지 B", 
        option_c: "선택지 C",
        option_d: "선택지 D",
        question_type: 'B'
      });
    } else if (upperType === 'C') {
      return res.json({
        problem_number: questionNumber,
        question_type: 'C',
        image_url: `https://${req.headers.host}/images/typeC/Q${questionNumber}.jpg`
      });
    }

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'An error occurred while fetching the question.' });
  }
}

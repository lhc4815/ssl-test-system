const mysql = require('mysql2/promise');

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
    console.log(`🔍 Fetching question from database: Type ${upperType}, Question ${questionNumber}`);

    // Connect to MySQL database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 60000
    });

    let query, params, rows;
    const baseUrl = `https://${req.headers.host}`;

    if (upperType === 'A') {
      query = 'SELECT problem_number, category_main, category_sub, question_text FROM problem_v1_type_a WHERE problem_number = ?';
      params = [questionNumber];
      [rows] = await connection.execute(query, params);
      
      if (rows.length === 0) {
        await connection.end();
        return res.status(404).json({ message: 'Question not found.' });
      }

      await connection.end();
      return res.json({
        ...rows[0],
        question_type: 'A'
      });

    } else if (upperType === 'B') {
      if (questionNumber <= 7) {
        query = 'SELECT problem_number, question_text, passage, option_a, option_b, option_c, option_d FROM problem_v1_type_b WHERE problem_number = ?';
        params = [questionNumber];
      } else if (questionNumber === 8) {
        // Return Q8-Q9 as a block
        query = 'SELECT problem_number, question_text, passage, option_a, option_b, option_c, option_d, common_passage FROM problem_v1_type_b WHERE problem_number IN (8, 9) ORDER BY problem_number ASC';
        params = [];
      } else if (questionNumber === 9) {
        await connection.end();
        return res.status(400).json({ message: 'Q9 is accessed via Q8 as a block.' });
      } else if (questionNumber === 10) {
        query = 'SELECT problem_number, question_text, passage, option_a, option_b, option_c, option_d FROM problem_v1_type_b WHERE problem_number = ?';
        params = [questionNumber];
      } else {
        await connection.end();
        return res.status(400).json({ message: 'Invalid question number for Type B. Must be 1-10.' });
      }

      [rows] = await connection.execute(query, params);
      await connection.end();

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Question not found.' });
      }

      if (questionNumber === 8 && rows.length > 1) {
        // Block response for Q8-Q9
        return res.json({
          question_type: 'B',
          is_block: true,
          common_passage: rows[0].common_passage,
          image_url: `${baseUrl}/images/typeB/Table_I.jpg`,
          questions: rows.map(row => {
            const { common_passage, ...questionData } = row;
            return questionData;
          })
        });
      } else {
        return res.json({
          ...rows[0],
          question_type: 'B'
        });
      }

    } else if (upperType === 'C') {
      if (questionNumber <= 7) {
        query = 'SELECT problem_number FROM problem_v1_type_c WHERE problem_number = ?';
        params = [questionNumber];
        [rows] = await connection.execute(query, params);
        
        if (rows.length === 0) {
          await connection.end();
          return res.status(404).json({ message: 'Question not found.' });
        }

        await connection.end();
        return res.json({
          ...rows[0],
          question_type: 'C',
          image_url: `${baseUrl}/images/typeC/Q${questionNumber}.jpg`
        });
      } else if (questionNumber === 8) {
        // Return Q8-Q10 as a block
        query = 'SELECT problem_number FROM problem_v1_type_c WHERE problem_number IN (8, 9, 10) ORDER BY problem_number ASC';
        [rows] = await connection.execute(query);
        
        if (rows.length === 0) {
          await connection.end();
          return res.status(404).json({ message: 'Questions not found.' });
        }

        await connection.end();
        return res.json({
          question_type: 'C',
          is_block: true,
          common_images: [
            `${baseUrl}/images/typeC/P1.jpg`,
            `${baseUrl}/images/typeC/P2.jpg`
          ],
          questions: rows.map(row => ({
            ...row,
            image_url: `${baseUrl}/images/typeC/Q${row.problem_number}.jpg`
          }))
        });
      } else {
        await connection.end();
        return res.status(400).json({ message: 'Invalid question number for Type C. Must be 1-10.' });
      }
    }

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'An error occurred while fetching the question.' });
  }
}

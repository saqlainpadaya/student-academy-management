const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');

app.use(cors());
app.use(express.json());

app.post('/api/pass', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT password,type,teacher_id,student_id FROM users WHERE email = ?', [email], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(404).json({ success: false, message: 'Email not found' });

    const decodedPassword = Buffer.from(result[0].password, 'base64').toString('utf8');
    const type = result[0].type ;
    const student_id = result[0].student_id ;
    const teacher_id = result[0].teacher_id ;
    if (password === decodedPassword) {
      res.json({ success: true , type,student_id,teacher_id });
    } else {
      res.json({ success: false, message: 'Invalid password' });
    }
  });
});

app.post('/api/login', (req, res) => {
  const { email } = req.body;
  
  db.query('SELECT * FROM students WHERE email = ?', [email], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(404).send('Email not found');
    res.send(result[0]); 
  });
});

app.post('/api/Tlogin', (req, res) => {
  const { email } = req.body;
  
  db.query('SELECT * FROM teachers WHERE email = ?', [email], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(404).send('Email not found');
    res.send(result[0]); 
  });
});


// student Academy data
app.get('/api/results/:student_id', (req, res) => {
  const student_id = req.params.student_id;
  const sql = `
    SELECT c.name AS course_name, c.semester, p.exam_type, p.score, p.exam_date
    FROM performance p
    JOIN courses c ON p.course_id = c.course_id
    WHERE p.student_id = ?
    ORDER BY c.semester DESC, p.exam_date DESC
  `;
  db.query(sql, [student_id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/api/teacher/performance/:teacher_id', (req, res) => {
  const teacherId = req.params.teacher_id;

  const sql = `
     SELECT c.name AS course_name, round(avg(p.score),2) as avg_Score ,c.semester , p.exam_type
    FROM courses c
    JOIN performance p ON c.course_id = p.course_id
    WHERE c.teacher_id = 14 group by c.semester, c.name,  p.exam_type;
  `;

  db.query(sql, [teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});


// 1. Get departments for a teacher
app.get('/api/teacher/:teacher_id/departments', (req, res) => {
  const { teacher_id } = req.params;
  const sql = `
    SELECT d.department_id, d.name 
    FROM teachers t
    JOIN departments d ON t.department_id = d.department_id
    WHERE t.teacher_id = ?
  `;
  db.query(sql, [teacher_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});

// 2. Get courses for a department
app.get('/api/department/:department_id/courses', (req, res) => {
  const { department_id } = req.params;
  const sql = `
    SELECT course_id, name
    FROM courses
    WHERE department_id = ?
  `;
  db.query(sql, [department_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});

// 3. Get students for a course
app.get('/api/course/:courseId/students', (req, res) => {
  const { courseId } = req.params;

  const query = `
    

     select  distinct  S.student_id,S.name, S.email
      from enrollments e 
     inner JOIN students S ON S.student_id = e.student_id 
     WHERE e.course_id= ? ;
   
  `;

  db.query(query, [courseId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// 4. Save attendance
app.post('/api/attendance', (req, res) => {
  const attendanceList = req.body; 
  if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
    return res.status(400).json({ message: 'Invalid attendance data' });
  }

  const sql = `
    INSERT INTO attendance (student_id, course_id, status, date)
    VALUES ?
  `;
  const values = attendanceList.map(item => [
    item.student_id,
    item.course_id,
    item.status,
    item.date
  ]);

  db.query(sql, [values], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Attendance saved', inserted: result.affectedRows });
  });
});

 // save marks
 app.post('/api/marks', (req, res) => {
  const attendanceList = req.body; 
  if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
    return res.status(400).json({ message: 'Invalid attendance data' });
  }

  const sql = `
    INSERT INTO performance (student_id, course_id, exam_type, exam_date, score)
    VALUES ?
  `;
  const values = attendanceList.map(item => [
    item.student_id,
    item.course_id,
    item.exam_type,
    item.exam_date,
    item.score
  ]);

  db.query(sql, [values], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Attendance saved', inserted: result.affectedRows });
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

const teacherId = sessionStorage.getItem('teacher_id') || 14; // fallback for testing
    console.log("Teacher ID:", teacherId);

    // ----------------- Teacher Performance Charts -----------------
    fetch(`http://localhost:3000/api/teacher/performance/${teacherId}`)
      .then(res => res.json())
      .then(data => {
        const grouped = {};
        data.forEach(item => {
          const key = `${item.course_name}__${item.semester}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(item);
        });

        const chartsContainer = document.getElementById('charts');

        Object.keys(grouped).forEach((key, index) => {
          const [courseName, semester] = key.split('__');
          const courseData = grouped[key];

          const examOrder = ["Quiz", "Assignment", "Midterm", "Final"];
          const sortedScores = examOrder.map(type => {
            const found = courseData.find(c => c.exam_type === type);
            return found ? parseFloat(found.avg_Score) : 0;
          });

          const container = document.createElement('div');
          container.classList.add('chart-container');

          const title = document.createElement('h3');
          title.textContent = `${courseName} (Semester ${semester})`;
          container.appendChild(title);

          const canvas = document.createElement('canvas');
          canvas.id = `chart${index}`;
          container.appendChild(canvas);

          chartsContainer.appendChild(container);

          new Chart(canvas, {
            type: 'polarArea',
            data: {
              labels: examOrder,
              datasets: [{
                label: 'Avg Score',
                data: sortedScores,
                backgroundColor: [
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(75, 192, 192, 0.6)'
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              scales: {
                r: {
                  beginAtZero: true,
                  suggestedMax: 100
                }
              }
            }
          });
        });
      })
      .catch(err => console.error('Error fetching performance data:', err));

    // ----------------- Attendance System -----------------
    fetch(`http://localhost:3000/api/teacher/${teacherId}/departments`)
      .then(res => res.json())
      .then(departments => {
        const deptDropdown = document.getElementById('departmentDropdown');
        deptDropdown.innerHTML = `<option value="">Select Department</option>`;
        departments.forEach(d => {
          deptDropdown.innerHTML += `<option value="${d.department_id}">${d.name}</option>`;
        });
      });

    document.getElementById('departmentDropdown').addEventListener('change', function() {
      const deptId = this.value;
      fetch(`http://localhost:3000/api/department/${deptId}/courses`)
        .then(res => res.json())
        .then(courses => {
          const courseDropdown = document.getElementById('courseDropdown');
          courseDropdown.innerHTML = `<option value="">Select Course</option>`;
          courses.forEach(c => {
            courseDropdown.innerHTML += `<option value="${c.course_id}">${c.name}</option>`;
          });
        });
    });

    document.getElementById('courseDropdown').addEventListener('change', function() {
      const courseId = this.value;
      fetch(`http://localhost:3000/api/course/${courseId}/students`)
        .then(res => res.json())
        .then(students => {
          const tbody = document.querySelector('#studentTable tbody');
          tbody.innerHTML = '';
          students.forEach(s => {
            tbody.innerHTML += `
              <tr>
                <td>${s.student_id}</td>
                <td>${s.name}</td>
                <td>
                  <select id="status-${s.student_id}">
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </td>
              </tr>
            `;
          });
          document.getElementById('studentTable').style.display = 'table';
          document.getElementById('saveBtn').style.display = 'inline-block';
        });
    });

    document.getElementById('saveBtn').addEventListener('click', function() {
      const courseId = document.getElementById('courseDropdown').value;
      const rows = document.querySelectorAll('#studentTable tbody tr');
      const attendanceData = Array.from(rows).map(row => {
        const studentId = row.querySelector('select').id.split('-')[1];
        const status = row.querySelector('select').value;
        //console.log(`student_id: ${studentId}, course_id: ${courseId}, status: ${status}, date: ${new Date().toISOString().split('T')[0]}`);
        return {
          student_id: studentId,
          course_id: courseId,
          status: status,
          date: new Date().toISOString().split('T')[0]
        };
      });

      fetch('http://localhost:3000/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
      })
      .then(res => res.json())
      .then(() => alert("Attendance saved successfully!"))
      .catch(err => console.error(err));
    });

 // ----------------- Marks Entry -----------------
// Populate Departments for Marks section
fetch(`http://localhost:3000/api/teacher/${teacherId}/departments`)
  .then(res => res.json())
  .then(departments => {
    const deptDropdown = document.getElementById('marksDepartmentDropdown');
    deptDropdown.innerHTML = `<option value="">Select Department</option>`;
    departments.forEach(d => {
      deptDropdown.innerHTML += `<option value="${d.department_id}">${d.name}</option>`;
    });
  });

// When Department changes, load Courses
document.getElementById('marksDepartmentDropdown').addEventListener('change', function() {
  const deptId = this.value;
  fetch(`http://localhost:3000/api/department/${deptId}/courses`)
    .then(res => res.json())
    .then(courses => {
      const courseDropdown = document.getElementById('marksCourseDropdown');
      courseDropdown.innerHTML = `<option value="">Select Course</option>`;
      courses.forEach(c => {
        courseDropdown.innerHTML += `<option value="${c.course_id}">${c.name}</option>`;
      });
    });
});

// When Course changes, load Students
document.getElementById('marksCourseDropdown').addEventListener('change', function() {
  const courseId = this.value;
  fetch(`http://localhost:3000/api/course/${courseId}/students`)
    .then(res => res.json())
    .then(students => {
      const tbody = document.querySelector('#marksstudentTable tbody');
      tbody.innerHTML = '';
      students.forEach(s => {
        tbody.innerHTML += `
          <tr>
            <td>${s.student_id}</td>
            <td>${s.name}</td>
            <td>
              <select id="exam_type-${s.student_id}">
                <option value="Midterm">Midterm</option>
                <option value="Quiz">Quiz</option>
                <option value="Final">Final</option>
                <option value="Assignment">Assignment</option>
              </select>
            </td>
            <td>
              <input type="number" id="marks-${s.student_id}" min="0" max="100" placeholder="Score">
            </td>
          </tr>
        `;
      });
      document.getElementById('marksstudentTable').style.display = 'table';
      document.getElementById('markssaveBtn').style.display = 'inline-block';
    });
});

// Save Marks
document.getElementById('markssaveBtn').addEventListener('click', function() {
  const courseId = document.getElementById('marksCourseDropdown').value;
  const rows = document.querySelectorAll('#marksstudentTable tbody tr');
  const marksData = Array.from(rows).map(row => {
    const studentId = row.querySelector('select').id.split('-')[1];
    const examType = row.querySelector('select').value;
    const input = row.querySelector(`#marks-${studentId}`);
    const score = input && input.value.trim() !== "" ? Number(input.value) : 0;
    return {
      student_id: studentId,
      course_id: courseId,
      exam_type: examType,
      exam_date: new Date().toISOString().split('T')[0],
      score: score
    };
  });
console.log(marksData);
  fetch('http://localhost:3000/api/marks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marksData)
  })
  .then(res => res.json())
  .then(() => alert('Marks saved successfully!'))
  .catch(err => console.error(err));
});

    
    

    function logout() {
    localStorage.clear();   // clears local storage
    sessionStorage.clear(); // clears session storage
    window.location.href = 'login.html';
    
}
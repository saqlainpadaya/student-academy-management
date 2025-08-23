const student_id = sessionStorage.getItem('student_id');
    fetch(`http://localhost:3000/api/results/${student_id}`)
      .then(res => res.json())
      .then(data => {
        const tbody = document.getElementById('results-body');
        data.forEach(row => {
          tbody.innerHTML += `
            <tr>
              <td>${row.semester}</td>
              <td>${row.course_name}</td>
              <td>${row.exam_type}</td>
              <td>${row.score}</td>
              <td>${new Date(row.exam_date).toLocaleDateString()}</td>
            </tr>`;
        });
      });

       function logout() {
    localStorage.clear();   // clears local storage
    sessionStorage.clear(); // clears session storage
    window.location.href = 'login.html';
       }
function checkpassword() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('password', password);
    fetch('http://localhost:3000/api/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(res => res.json())
        .then(response => {
            if (response.success && response.type == "student") {
                //student_login(); 
                sessionStorage.setItem('student_id', response.student_id);
                window.location.href = 'studentDashboard.html';
            } else if (response.success && response.type == "teacher") {
                //teacher_login();
                sessionStorage.setItem('teacher_id', response.teacher_id);
                window.location.href = 'teacherDashboard.html';
            }
            else {
                alert(response.message || 'Password OR Email Incorrect');
            }
        })
        .catch(() => alert("Password OR Email Incorrect"));
}

function myFunction() {
    var x = document.getElementById("password");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}

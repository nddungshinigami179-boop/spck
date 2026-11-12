// Lấy dữ liệu người dùng từ localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem("crzspyUsers")) || [];
}

// Hiển thị thông báo
function showMessage(message, color = "red") {
    const messageElement = document.getElementById("message");

    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.color = color;
    }
}

// XỬ LÝ ĐĂNG KÝ
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("registerUsername").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        let users = getUsers();

        if (username.length < 6 || username.length > 18) {
            showMessage("Tên tài khoản phải từ 6 đến 18 ký tự!");
            return;
        }

        if (password.length < 8) {
            showMessage("Mật khẩu phải có ít nhất 8 ký tự!");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("Mật khẩu xác nhận không khớp!");
            return;
        }

        const existingUser = users.find(user => user.email === email);

        if (existingUser) {
            showMessage("Email này đã được đăng ký!");
            return;
        }

        const newUser = {
            id: Date.now(),
            username: username,
            email: email,
            password: password
        };

        users.push(newUser);

        localStorage.setItem("crzspyUsers", JSON.stringify(users));

        showMessage("Đăng ký thành công!", "green");

        setTimeout(() => {
            window.location.href = "signin.html";
        }, 1000);
    });
}

// XỬ LÝ ĐĂNG NHẬP
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const users = getUsers();

        const user = users.find(function (user) {
            return user.email === email && user.password === password;
        });

        if (!user) {
            showMessage("Email hoặc mật khẩu không chính xác!");
            return;
        }

        const currentUser = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        localStorage.setItem(
            "crzspyCurrentUser",
            JSON.stringify(currentUser)
        );

        showMessage("Đăng nhập thành công!", "green");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    });
}

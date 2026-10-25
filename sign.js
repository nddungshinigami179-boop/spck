const usersKey = "crzspyUsers";
const currentUserKey = "crzspyCurrentUser";

const authForm = document.getElementById("authForm");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const usernameGroup = document.getElementById("usernameGroup");
const confirmGroup = document.getElementById("confirmGroup");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const submitButton = document.getElementById("submitButton");
const switchPrompt = document.getElementById("switchPrompt");
const switchButton = document.getElementById("switchButton");
const authMessage = document.getElementById("authMessage");

let authMode = "login";

// Đọc danh sách tài khoản
function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(usersKey) || "[]");
        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
}

// Lưu danh sách tài khoản
function saveUsers(users) {
    localStorage.setItem(usersKey, JSON.stringify(users));
}

// Hiển thị thông báo
function showMessage(message, type = "error") {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
}

// Chuyển giữa đăng nhập và đăng ký
function setAuthMode(mode) {
    authMode = mode;

    const isRegister = mode === "register";

    formTitle.textContent = isRegister
        ? "Tạo tài khoản mới"
        : "Chào mừng trở lại";

    formSubtitle.textContent = isRegister
        ? "Đăng ký để khám phá thế giới âm nhạc"
        : "Đăng nhập để tiếp tục nghe nhạc";

    usernameGroup.hidden = !isRegister;
    confirmGroup.hidden = !isRegister;

    usernameInput.required = isRegister;
    confirmPasswordInput.required = isRegister;

    passwordInput.autocomplete = isRegister
        ? "new-password"
        : "current-password";

    loginTab.classList.toggle("active", !isRegister);
    registerTab.classList.toggle("active", isRegister);

    submitButton.textContent = isRegister
        ? "Tạo tài khoản"
        : "Đăng nhập";

    switchPrompt.textContent = isRegister
        ? "Đã có tài khoản?"
        : "Chưa có tài khoản?";

    switchButton.textContent = isRegister
        ? "Đăng nhập"
        : "Đăng ký ngay";

    authMessage.textContent = "";
    authMessage.className = "message";
}

loginTab.addEventListener("click", () => setAuthMode("login"));
registerTab.addEventListener("click", () => setAuthMode("register"));

switchButton.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
});

// Ẩn hoặc hiện mật khẩu
document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        const showPassword = input.type === "password";

        input.type = showPassword ? "text" : "password";
        button.textContent = showPassword ? "Ẩn" : "Hiện";
    });
});

// Băm mật khẩu bằng Web Crypto API
async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

function createSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));

    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// Đăng ký
async function registerUser() {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (username.length < 3 || username.length > 30) {
        showMessage("Tên người dùng phải từ 3 đến 30 ký tự.");
        return;
    }

    if (!emailInput.validity.valid || !email) {
        showMessage("Vui lòng nhập email hợp lệ.");
        return;
    }

    if (password.length < 8) {
        showMessage("Mật khẩu phải có ít nhất 8 ký tự.");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Mật khẩu xác nhận không khớp.");
        return;
    }

    const users = getUsers();

    if (users.some(user => user.email === email)) {
        showMessage("Email này đã được đăng ký.");
        return;
    }

    if (!crypto.subtle) {
        showMessage("Trình duyệt cần hỗ trợ Web Crypto. Hãy chạy web bằng localhost hoặc HTTPS.");
        return;
    }

    const salt = createSalt();
    const passwordHash = await hashPassword(password, salt);

    const newUser = {
        id: crypto.randomUUID(),
        username,
        email,
        salt,
        passwordHash,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    authForm.reset();
    setAuthMode("login");
    emailInput.value = email;

    showMessage("Đăng ký thành công! Hãy đăng nhập.", "success");
}

// Đăng nhập
async function loginUser() {
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!emailInput.validity.valid || !email || !password) {
        showMessage("Vui lòng nhập email và mật khẩu hợp lệ.");
        return;
    }

    const users = getUsers();

    const user = users.find(item => item.email === email);

    if (!user) {
        showMessage("Email hoặc mật khẩu không chính xác.");
        return;
    }

    if (!crypto.subtle) {
        showMessage("Trình duyệt cần hỗ trợ Web Crypto. Hãy chạy web bằng localhost hoặc HTTPS.");
        return;
    }

    const passwordHash = await hashPassword(password, user.salt);

    if (passwordHash !== user.passwordHash) {
        showMessage("Email hoặc mật khẩu không chính xác.");
        return;
    }

    // Chỉ lưu thông tin cần dùng trong phiên đăng nhập
    const currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        loginAt: new Date().toISOString()
    };

    localStorage.setItem(
        currentUserKey,
        JSON.stringify(currentUser)
    );

    window.location.href = "index.html";
}

// Xử lý submit
authForm.addEventListener("submit", async event => {
    event.preventDefault();

    submitButton.disabled = true;
    showMessage("");

    try {
        if (authMode === "register") {
            await registerUser();
        } else {
            await loginUser();
        }
    } catch (error) {
        console.error("Lỗi xác thực:", error);
        showMessage("Có lỗi xảy ra. Hãy thử lại.");
    } finally {
        submitButton.disabled = false;
    }
});

// Nếu đã đăng nhập, chuyển về trang nghe nhạc
try {
    if (localStorage.getItem(currentUserKey)) {
        const currentUser = JSON.parse(
            localStorage.getItem(currentUserKey)
        );

        if (currentUser && currentUser.id) {
            window.location.replace("index.html");
        }
    }
} catch {
    localStorage.removeItem(currentUserKey);
}

const currentUserKey = "crzspyCurrentUser";

function getCurrentUser() {
    try {
        const user = JSON.parse(
            localStorage.getItem(currentUserKey) || "null"
        );

        if (!user || !user.id || !user.email) {
            return null;
        }

        return user;
    } catch {
        return null;
    }
}

const currentUser = getCurrentUser();

// Chưa đăng nhập thì quay về trang đăng nhập
if (!currentUser) {
    window.location.replace("sign.html");
} 
else {
    // Hiển thị thông tin tài khoản
    const accountName = document.getElementById("accountName");

    if (accountName) {
        accountName.textContent =
            currentUser.username || currentUser.email;
    }

    // Xử lý đăng xuất
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem(currentUserKey);
            window.location.replace("sign.html");
        });
    }
}
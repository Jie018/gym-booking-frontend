document.querySelector("button").addEventListener("click", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    const errorMsg = document.getElementById("login-error");

    // 清空錯誤訊息
    errorMsg.textContent = '';

    // 檢查必填欄位是否空白
    if (!username || !email || !password || !confirmPassword) {
        errorMsg.textContent = "所有欄位為必填";
        return;
    }

    // 信箱格式驗證
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        errorMsg.textContent = "請輸入有效的信箱格式";
        return;
    }

    // 其他驗證（例如密碼是否一致）
    if (password !== confirmPassword) {
        errorMsg.textContent = "密碼與確認密碼不一致";
        return;
    }

    // 密碼格式驗證
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordPattern.test(password)) {
        errorMsg.textContent = "密碼需至少8位，包含大小寫英文字母與數字";
        return;
    }
    //密碼大小寫不一致，也會不符合規格

    // 檢查是否有重複的使用者名稱
    try {
        const response = await fetch(`http://127.0.0.1:8000/check_username?username=${username}`);
        const result = await response.json();
        if (result.exists) {
            errorMsg.textContent = "此使用者名稱已存在，請選擇其他名稱";
            return;
        }
    } catch (err) {
        errorMsg.textContent = "無法檢查使用者名稱，請稍後再試";
        return;
    }

    // 成功才送出請求
    try {
        const response = await fetch("http://127.0.0.1:8000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                username: username,
                password: password,
                email: email
            }).toString()
            
        });

        const result = await response.json();
        if (response.ok) {
            alert("註冊成功！");
            window.location.href = "login.html";
        } else {
            errorMsg.textContent = result.detail || "註冊失敗";
        }
    } catch (err) {
        errorMsg.textContent = "連線錯誤，請稍後再試";
    }
});

// 顯示/隱藏密碼
document.getElementById("toggle-password").addEventListener("click", function() {
    const passwordField = document.getElementById("password");
    if (passwordField.type === "password") {
        passwordField.type = "text";
        this.classList.remove("bi-eye-slash");
        this.classList.add("bi-eye");
    } else {
        passwordField.type = "password";
        this.classList.remove("bi-eye");
        this.classList.add("bi-eye-slash");
    }
});

// 顯示/隱藏確認密碼
document.getElementById("toggle-confirm-password").addEventListener("click", function() {
    const confirmPasswordField = document.getElementById("confirm-password");
    if (confirmPasswordField.type === "password") {
        confirmPasswordField.type = "text";
        this.classList.remove("bi-eye-slash");
        this.classList.add("bi-eye");
    } else {
        confirmPasswordField.type = "password";
        this.classList.remove("bi-eye");
        this.classList.add("bi-eye-slash");
    }
});

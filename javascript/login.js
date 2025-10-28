document.getElementById("login-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    try {
        const response = await fetch("http://127.0.0.1:8000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                username: user,
                password: pass
            })
        });

        const result = await response.json();
        console.log("後端回傳結果:", result);


        if (response.ok) {
            // 儲存登入狀態與帳號資訊（使用後端回傳的值更準確）
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("username", result.username); // 從後端回傳拿正確使用者名稱
            localStorage.setItem("user_id", result.user_id);   // 使用者 id

            alert("登入成功！");
            window.location.href = "web.html";
        } else {
            document.getElementById("login-error").textContent = result.detail || "登入失敗";
        }
    } catch (err) {
        document.getElementById("login-error").textContent = "連線錯誤，請稍後再試";
    }
});

document.getElementById("login-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  try {
      const response = await fetch("https://gym-booking-backend-1.onrender.com/login", {
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

      if (response.ok) {
          // 儲存登入狀態與帳號資訊（使用後端回傳的值更準確）
          localStorage.setItem("loggedIn", "true");
          localStorage.setItem("username", result.username); // 從後端回傳拿正確使用者名稱
          localStorage.setItem("user_id", result.user_id);   // 使用者 id

          alert("登入成功！");
          window.location.href = "admin_review.html";
      } else {
          document.getElementById("login-error").textContent = result.detail || "登入失敗";
      }
  } catch (err) {
      document.getElementById("login-error").textContent = "連線錯誤，請稍後再試";
  }
});

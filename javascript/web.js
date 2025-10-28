// web.js

// 登出功能
function logout() {
    // 清除登入資訊
    localStorage.removeItem('user_id');
    localStorage.removeItem('token');       // 如果有存 token
    localStorage.removeItem('username');    // 使用者名稱

    // 導向首頁
    window.location.href = 'index.html';
}

// 頁面載入時顯示個人化名稱
document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");
    const user_id = localStorage.getItem("user_id");

    // 測試用：確認 localStorage 是否有資料
    console.log("localStorage username:", username);
    console.log("localStorage user_id:", user_id);

    // 更新左側使用者名稱
    if (username) {
        const usernameDiv = document.querySelector(".profile-container .username");
        if (usernameDiv) {
            usernameDiv.textContent = `使用者: ${username}`;
        }
    }
});

document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("user_id");
  const API_BASE = "http://127.0.0.1:8000";
  const container = document.getElementById("recent-bookings");

  // 若尚未登入
  if (!container) return;
  if (!userId) {
    container.innerHTML = `<p>請先登入以查看您的預約紀錄。</p>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/my_reservations?user_id=${userId}`);
    const data = await res.json();
    const reservations = (data.reservations || []).slice(0, 3); // 顯示三筆
    container.innerHTML = "";

    if (reservations.length === 0) {
      container.innerHTML = `<p>目前沒有預約紀錄。</p>`;
      return;
    }

    reservations.forEach(r => {
      const date = r.start_time ? new Date(r.start_time).toLocaleDateString() : "-";
      const start = r.start_time ? new Date(r.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "-";
      const end = r.end_time ? new Date(r.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "-";
      const statusClass =
        r.status === "預約成功" ? "status-confirmed" :
        r.status === "審核中" ? "status-pending" :
        "status-cancelled";

      const div = document.createElement("div");
      div.classList.add("booking-item");
      div.innerHTML = `
        <div class="booking-venue">${r.venue_name || "未知場地"}</div>
        <div class="booking-details">
          <div>日期：${date}</div>
          <div>時間：${start} - ${end}</div>
          <div class="booking-status ${statusClass}">${r.status}</div>
        </div>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error("載入近期預約失敗：", err);
    container.innerHTML = `<p>載入預約資料時發生錯誤。</p>`;
  }
});

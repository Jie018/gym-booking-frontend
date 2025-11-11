const API_BASE = "https://gym-booking-backend-1.onrender.com";

// 場地人數限制設定
const venuePeopleLimits = {
  4: { min: 2, max: 4 } // 桌球場
};

document.addEventListener('DOMContentLoaded', () => {
  const venueId = 4;
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('booking-date');
  const slotContainer = document.getElementById('time-slots-container');
  const peopleCountInput = document.getElementById('people-count');
  const studentIdContainer = document.getElementById('student-id-inputs');
  const submitBtn = document.getElementById('submit-booking');

  let selectedSlotId = null;
  let startHHMM = null;
  let endHHMM = null;

  // 限制只能選今天以後的日期
  dateInput.setAttribute('min', today);
  dateInput.value = today;

  // 動態產生學號欄位
  function updateStudentIdInputs() {
    const count = parseInt(peopleCountInput.value, 10);
    studentIdContainer.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-input student-id";
      input.placeholder = `請輸入第 ${i + 1} 位學號`;
      input.maxLength = 9;
      input.required = true;
      studentIdContainer.appendChild(input);
    }
  }

  if (peopleCountInput) {
    peopleCountInput.addEventListener("change", updateStudentIdInputs);
  }

  // 時間格式轉換（秒數 → HH:MM）
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  // 載入可預約時段
  async function loadAvailableSlots() {
    const date = dateInput.value;
    if (!venueId || !date) return;

    try {
      const res = await fetch(`${API_BASE}/api/available_slots?venue_id=${venueId}&date=${date}`);
      const data = await res.json();
      console.log("後端 available_slots raw:", data); // ✅ 印出所有時段
      const slots = data.slots || [];

      slotContainer.innerHTML = "";

      if (slots.length === 0) {
        slotContainer.innerHTML = "<p class='no-slot'>此日尚無預約時段</p>";
        return;
      }

      const now = new Date();

      slots.forEach(slot => {
        const slotBtn = document.createElement("button");
        slotBtn.className = "slot-btn";

        // ⚡ 修正：使用後端秒數轉換 HH:MM
        const startText = formatTime(slot.start_time);
        const endText = formatTime(slot.end_time);

        slotBtn.textContent = `${startText} - ${endText}`;

        const [startHour, startMin] = startText.split(":").map(Number);
        const [endHour, endMin] = endText.split(":").map(Number);
        const startTime = new Date(date);
        const endTime = new Date(date);
        startTime.setHours(startHour, startMin, 0, 0);
        endTime.setHours(endHour, endMin, 0, 0);

        if (endTime <= now) {
          slotBtn.disabled = true;
          slotBtn.classList.add("slot-disabled");
          slotBtn.title = "此時間段已過無法預約";
        }

        slotBtn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn.selected").forEach(btn => btn.classList.remove("selected"));
        slotBtn.classList.add("selected");

        selectedSlotId = slot.id;

        // ⚡ 將 HH:MM 轉成秒數
        const [startH, startM] = startText.split(":").map(Number);
        const [endH, endM] = endText.split(":").map(Number);
        startHHMM = startH * 3600 + startM * 60;
        endHHMM   = endH * 3600 + endM * 60;

        console.log("選擇的時間段（秒數）:", startHHMM, "-", endHHMM);
    });

        slotContainer.appendChild(slotBtn);
      });
    } catch (err) {
      console.error("刷新可預約時段失敗", err);
      slotContainer.innerHTML = "<p>載入時段失敗，請稍後重試。</p>";
    }
  }

  // ---------------------------
// 提交預約
// ---------------------------
async function handleBooking() {
  const date = dateInput.value;
  const phone = document.getElementById("contact-phone")?.value;
  const studentIds = Array.from(document.querySelectorAll(".student-id")).map(i => i.value.trim());

  const userIdRaw = localStorage.getItem('user_id');
  const userId = userIdRaw ? Number(userIdRaw) : null;
  if (!userId) {
    alert('請先登入再預約');
    window.location.href = 'login.html';
    return;
  }

  if (!startHHMM || !endHHMM) {
    alert("請先選擇一個可預約時段！");
    return;
  }

  // 驗證電話
  const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;
  if (!phoneRegex.test(phone)) {
    alert("電話格式錯誤，請輸入 09xx-xxx-xxx 或 09xxxxxxxx");
    return;
  }

  // 驗證學號
  const studentRegex = /^4\d{8}$/;
  for (let i = 0; i < studentIds.length; i++) {
    if (!studentRegex.test(studentIds[i])) {
      alert("學號格式錯誤，每位學生必須輸入 4 開頭 + 8 個數字（共 9 碼）");
      return;
    }
  }

  // ⚡ 修改 payload，完全符合後端欄位
  const payload = {
    user_id: userId,
    venue_id: venueId,
    date: date,
    time_slots: [startHHMM, endHHMM],  // ⚡ 這裡是秒數
    people_count: studentIds.length,
    contact_phone: phone,
    student_ids: studentIds
  };

  console.log("📤 Booking Payload (後端格式):", payload);

  try {
    const res = await fetch(`${API_BASE}/api/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("✅ 預約成功！");
      loadAvailableSlots(); // 重新載入可用時段
    } else {
      const errData = await res.json();
      console.error("後端錯誤訊息:", errData);
      alert(`❌ 預約失敗：${errData.detail || "未知錯誤"}`);
    }
  } catch (err) {
    console.error("提交預約錯誤", err);
    alert("系統發生錯誤，請稍後再試。");
  }
}


  if (dateInput) dateInput.addEventListener("change", loadAvailableSlots);
  if (submitBtn) submitBtn.addEventListener("click", handleBooking);

  updateStudentIdInputs();
  loadAvailableSlots();
});

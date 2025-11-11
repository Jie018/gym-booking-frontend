// basketball.js - 排球場預約
const API_BASE = "https://gym-booking-backend-1.onrender.com";

// 場地人數限制設定
const venuePeopleLimits = {
  5: { min: 6, max: 12 } // 排球場
};

document.addEventListener('DOMContentLoaded', () => {
  const venueId = 5;
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('booking-date');
  const slotContainer = document.getElementById('time-slots-container');
  const peopleCountInput = document.getElementById('people-count');
  const studentIdContainer = document.getElementById('student-id-inputs');
  const submitBtn = document.getElementById('submit-booking');
  let selectedSlotId = null;

  // 限制只能選今天以後的日期
  dateInput.setAttribute('min', today);
  dateInput.value = today;

  // 動態產生學號輸入欄位
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

  // 秒數 → "HH:MM"
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  // 載入可預約時段（按鈕式）
  async function loadAvailableSlots() {
    const date = dateInput.value;
    if (!venueId || !date) return;

    try {
      const res = await fetch(`${API_BASE}/api/available_slots?venue_id=${venueId}&date=${date}`);
      const data = await res.json();
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

        const startText = formatTime(slot.start_time);
        const endText = formatTime(slot.end_time);
        slotBtn.textContent = `${startText} - ${endText}`;

        const [startHour, startMin] = startText.split(":").map(Number);
        const [endHour, endMin] = endText.split(":").map(Number);
        const startTime = new Date(date);
        const endTime = new Date(date);
        startTime.setHours(startHour, startMin, 0, 0);
        endTime.setHours(endHour, endMin, 0, 0);

        // 時段已過，禁用
        if (endTime <= now) {
          slotBtn.disabled = true;
          slotBtn.classList.add("slot-disabled");
          slotBtn.title = "此時間段已過無法預約";
        }

        slotBtn.addEventListener("click", () => {
          document.querySelectorAll(".slot-btn.selected").forEach(btn => btn.classList.remove("selected"));
          slotBtn.classList.add("selected");
          selectedSlotId = slot.id;
          // ⚡ 新增：記錄時間字串
          startHHMM = formatTime(slot.start_time);
          endHHMM = formatTime(slot.end_time);
        });

        slotContainer.appendChild(slotBtn);
      });
    } catch (err) {
      console.error("刷新可預約時段失敗", err);
      slotContainer.innerHTML = "<p>載入時段失敗，請稍後重試。</p>";
    }
  }

  // 提交預約
  async function handleBooking() {
    const bookingDate = dateInput.value;
    const peopleCount = parseInt(peopleCountInput.value, 10);
    const studentIds = Array.from(document.querySelectorAll(".student-id")).map(i => i.value.trim());
    const contactPhone = document.getElementById("contact-phone")?.value.trim();

    // 登入驗證
    const userIdRaw = localStorage.getItem('user_id');
    const userId = userIdRaw ? Number(userIdRaw) : null;
    if (!userId) {
      alert('請先登入再預約');
      window.location.href = 'login.html';
      return;
    }

    // 選擇時段檢查
    if (!selectedSlotId) {
      alert("請先選擇一個可預約時段！");
      return;
    }

    // 電話格式驗證
    const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;
    if (!phoneRegex.test(contactPhone)) {
      alert("電話格式錯誤，請輸入 09xx-xxx-xxx 或 09xxxxxxxx");
      return;
    }

    // 學號格式驗證
    const studentRegex = /^4\d{8}$/;
    if (studentIds.some(id => !studentRegex.test(id))) {
      alert("學號格式錯誤，每位學生必須輸入 4 開頭 + 8 個數字（共 9 碼）");
      return;
    }

    // 場地人數限制
    const limits = venuePeopleLimits[venueId];
    if (limits && (peopleCount < limits.min || peopleCount > limits.max)) {
      alert(`排球場人數需介於 ${limits.min} ~ ${limits.max} 人之間`);
      return;
    }

    // 基本欄位檢查
    if (!bookingDate || isNaN(peopleCount) || peopleCount <= 0 || !contactPhone) {
      alert('請確認：日期、人數、電話都已填寫');
      return;
    }
    if (studentIds.length !== peopleCount || studentIds.some(id => id === "")) {
      alert('請輸入所有學號，數量需與人數一致');
      return;
    }

    const payload = {
      user_id: userId,
      venue_id: venueId,
      date: dateInput.value,            // ⚡ 新增：必填欄位
      time_slots: [startHHMM, endHHMM],
      people_count: studentIds.length,
      contact_phone: phone,
      student_ids: studentIds,
    };

    console.log("📤 排球場 Booking 資料即將送出：", payload);

    try {
      const res = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("✅ 預約成功！");
        loadAvailableSlots();
      } else {
        const errData = await res.json();
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

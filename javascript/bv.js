// basketball.js
const API_BASE = "https://gym-booking-backend-1.onrender.com";
const venueId = 3; // 籃球場
const venuePeopleLimits = {
  3: { min: 5, max: 10 } // 籃球場人數限制
};

// 秒數 → "HH:MM"
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}`;
}

// 產生學號輸入欄位
function updateStudentIdInputs() {
  const count = parseInt(document.getElementById('people-count').value, 10);
  const slotContainer = document.getElementById('student-id-inputs'); // ⚡ 改名保持一致
  slotContainer.innerHTML = '';
  if (isNaN(count) || count <= 0) return;

  for (let i = 0; i < count; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input student-id';
    input.placeholder = `請輸入第 ${i + 1} 位學生學號`;
    input.maxLength = 9;
    input.required = true;
    slotContainer.appendChild(input);
  }
}

// 載入可預約時段
async function loadAvailableSlots() {
  const date = document.getElementById('booking-date').value;
  const slotContainer = document.getElementById('time-slots-container'); // ⚡ 統一名稱
  slotContainer.innerHTML = '';
  if (!date) return;

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
    let selectedSlotId = null;

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

      if (endTime <= now) {
        slotBtn.disabled = true;
        slotBtn.classList.add("slot-disabled");
        slotBtn.title = "此時間段已過無法預約";
      }

      slotBtn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn.selected").forEach(btn => btn.classList.remove("selected"));
        slotBtn.classList.add("selected");
        selectedSlotId = slot.id;

        // ⚡ 記錄時間字串，供提交預約使用
        startHHMM = formatTime(slot.start_time);
        endHHMM = formatTime(slot.end_time);

        // ⚡ 將選擇的 slot id 存到 container dataset
        slotContainer.dataset.selectedSlotId = slot.id;
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
  const date = document.getElementById("booking-date")?.value;
  const phone = document.getElementById("contact-phone")?.value.trim();
  const studentIds = Array.from(document.querySelectorAll(".student-id")).map(i => i.value.trim());
  const peopleCount = parseInt(document.getElementById('people-count').value, 10);

  const userIdRaw = localStorage.getItem('user_id');
  const userId = userIdRaw ? Number(userIdRaw) : null;
  if (!userId) {
    alert('請先登入再預約');
    window.location.href = 'login.html';
    return;
  }

  const slotContainer = document.getElementById('time-slots-container');
  const selectedSlotId = slotContainer.dataset.selectedSlotId;
  if (!selectedSlotId) {
    alert("請先選擇一個可預約時段！");
    return;
  }

  const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;
  if (!phoneRegex.test(phone)) {
    alert("電話格式錯誤，請輸入 09xx-xxx-xxx 或 09xxxxxxxx");
    return;
  }

  const studentRegex = /^4\d{8}$/;
  if (studentIds.some(id => !studentRegex.test(id))) {
    alert("學號格式錯誤，每位學生必須輸入 4 開頭 + 8 個數字（共 9 碼）");
    return;
  }

  const limits = venuePeopleLimits[venueId];
  if (limits && (peopleCount < limits.min || peopleCount > limits.max)) {
    alert(`籃球場人數需介於 ${limits.min} ~ ${limits.max} 人之間`);
    return;
  }

  const payload = {
    user_id: userId,
    venue_id: venueId,
    time_slots: [startHHMM, endHHMM],       // ⚡ 後端要求的格式 ["HH:MM","HH:MM"]
    people_count: studentIds.length,         // ⚡ 對應後端欄位
    contact_phone: phone,                    // ⚡ 對應後端欄位
    student_ids: studentIds,
  };

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

// 綁定事件
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('booking-date');
  const peopleCountInput = document.getElementById('people-count');
  const submitBtn = document.getElementById('submit-booking');

  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
  dateInput.value = today;

  if (peopleCountInput) peopleCountInput.addEventListener("change", updateStudentIdInputs);
  updateStudentIdInputs();

  if (dateInput) dateInput.addEventListener("change", loadAvailableSlots);
  if (submitBtn) submitBtn.addEventListener("click", handleBooking);

  loadAvailableSlots();
});

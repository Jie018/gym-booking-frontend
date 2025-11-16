const API_BASE = "https://gym-booking-backend-1.onrender.com";
// ====== 場地人數限制設定 ======
const venuePeopleLimits = {
  4: { min: 2, max: 4 } // 桌球場
};

// 秒數 → "HH:MM"
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}`;
}

// 套用場地人數限制
function updatePeopleInputLimit(venueId) {
  const limits = venuePeopleLimits[venueId] || { min: 1, max: 10 };
  const peopleInput = document.getElementById('people-count');
  peopleInput.min = limits.min;
  peopleInput.max = limits.max;

  let currentValue = parseInt(peopleInput.value) || limits.min;
  if (currentValue < limits.min) currentValue = limits.min;
  if (currentValue > limits.max) currentValue = limits.max;
  peopleInput.value = currentValue;
}

// 產生學號輸入欄位
function updateStudentIdInputs() {
  const peopleCount = parseInt(document.getElementById('people-count').value);
  const container = document.getElementById('student-id-inputs');
  container.innerHTML = '';
  if (isNaN(peopleCount) || peopleCount <= 0) return;

  for (let i = 0; i < peopleCount; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input student-id';
    input.placeholder = `請輸入第 ${i + 1} 位學生學號`;
    container.appendChild(input);
  }
}

// 載入可預約時段
async function loadAvailableSlots() {
  const dateInput = document.getElementById('booking-date');
  const slotContainer = document.getElementById('time-slots-container');
  const venueId = 4;
  const date = dateInput.value;
  slotContainer.innerHTML = '';

  if (!date) return;

  try {
    const res = await fetch(`${API_BASE}/api/available_slots?venue_id=${venueId}&date=${date}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || '載入可預約時段失敗');

    const slots = data.slots || [];
    if (slots.length === 0) {
      slotContainer.innerHTML = '<p>此日無可預約時段。</p>';
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

      // 若時段已過，禁用並加上提示
      if (endTime <= now) {
        slotBtn.disabled = true;
        slotBtn.classList.add("slot-disabled");
        slotBtn.title = "此時間段已過無法預約";
      }

      slotBtn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn.selected").forEach(btn => btn.classList.remove("selected"));
        slotBtn.classList.add("selected");
        slotBtn.selectedSlotId = slot.id;
      });

      slotContainer.appendChild(slotBtn);
    });
  } catch (err) {
    console.error("刷新可預約時段失敗", err);
    slotContainer.innerHTML = "<p>載入時段失敗，請稍後重試。</p>";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const venueId = 4;
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

  // ✅ 初始化人數限制
  updatePeopleInputLimit(venueId);

  // ✅ 動態產生學號輸入欄位
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

  // ===== 提交預約 =====
  async function handleBooking() {
    const bookingDate = document.getElementById('booking-date').value;
    const peopleCount = parseInt(document.getElementById('people-count').value);
    const studentIds = Array.from(document.querySelectorAll('.student-id')).map(i => i.value.trim());
    const contactPhone = document.getElementById('contact-phone').value.trim();

    // 從登入資訊取得 user_id
    const userIdRaw = localStorage.getItem('user_id');
    const userId = userIdRaw ? Number(userIdRaw) : null;
    if (!userId) {
      alert('請先登入再預約');
      window.location.href = 'login.html';
      return;
    }

    // 檢查是否選擇時段
    if (!selectedSlotId) {
      alert("請先選擇一個可預約時段！");
      return;
    }

    // 驗證電話格式
    const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;
    if (!phoneRegex.test(contactPhone)) {
      alert("電話格式錯誤，請輸入 09xx-xxx-xxx 或 09xxxxxxxx");
      return;
    }

    // 驗證學號格式
    const studentRegex = /^4\d{8}$/;
    if (studentIds.some(id => !studentRegex.test(id))) {
      alert("學號格式錯誤，每位學生必須輸入 4 開頭 + 8 個數字（共 9 碼）");
      return;
    }

    // 驗證人數限制
    const limits = venuePeopleLimits[venueId] || { min: 1, max: 10 };
    if (peopleCount < limits.min || peopleCount > limits.max) {
      alert(`人數需介於 ${limits.min} ~ ${limits.max} 人`);
      return;
    }

    const payload = {
      user_id: userId,
      venue_id: venueId,
      slot_id: selectedSlotId,
      date: bookingDate,
      phone: contactPhone,
      student_ids: studentIds,
      people_count: peopleCount // ✅ 加入人數
    };

    try {
      const res = await fetch(`${API_BASE}/api/book`, {
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

// main.js - 桌球場預約
const API_BASE = "https://gym-booking-backend-1.onrender.com";

// 場地人數限制設定
const venuePeopleLimits = {
  4: { min: 2, max: 4 } // 桌球場
};

// 時間秒數 → "HH:MM"
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// 產生學號輸入欄位
function updateStudentIdInputs(count, container) {
  container.innerHTML = '';
  if (isNaN(count) || count <= 0) return;

  for (let i = 0; i < count; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input student-id';
    input.placeholder = `請輸入第 ${i + 1} 位學生學號`;
    input.maxLength = 9;
    input.required = true;
    container.appendChild(input);
  }
}

// 載入可預約時段
async function loadAvailableSlots(venueId, date, slotContainer, callback) {
  slotContainer.innerHTML = '';
  if (!venueId || !date) return;

  try {
    const res = await fetch(`${API_BASE}/api/available_slots?venue_id=${venueId}&date=${date}`);
    const data = await res.json();
    const slots = data.slots || [];

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

      if (endTime <= now) {
        slotBtn.disabled = true;
        slotBtn.classList.add("slot-disabled");
        slotBtn.title = "此時間段已過無法預約";
      }

      slotBtn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn.selected").forEach(btn => btn.classList.remove("selected"));
        slotBtn.classList.add("selected");
        if (callback) callback(slot.id, startText, endText);
      });

      slotContainer.appendChild(slotBtn);
    });
  } catch (err) {
    console.error("刷新可預約時段失敗", err);
    slotContainer.innerHTML = "<p>載入時段失敗，請稍後重試。</p>";
  }
}

// 提交預約
async function handleBooking(venueId, dateInput, peopleCountInput, studentIdContainer, slotContainer, selectedSlot) {
  const bookingDate = dateInput.value;
  const peopleCount = parseInt(peopleCountInput.value, 10);
  const studentIds = Array.from(studentIdContainer.querySelectorAll('.student-id')).map(i => i.value.trim());
  const contactPhone = document.getElementById('contact-phone')?.value.trim();

  const userIdRaw = localStorage.getItem('user_id');
  const userId = userIdRaw ? Number(userIdRaw) : null;
  if (!userId) {
    alert('請先登入再預約');
    window.location.href = 'login.html';
    return;
  }

  // 人數限制
  const limits = venuePeopleLimits[venueId];
  if (limits && (peopleCount < limits.min || peopleCount > limits.max)) {
    alert(`此場地人數需介於 ${limits.min} ~ ${limits.max} 人`);
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

  // 選擇時段
  if (!selectedSlot.id || !selectedSlot.start || !selectedSlot.end) {
    alert("請先選擇可預約時段");
    return;
  }

  const payload = {
    user_id: userId,
    venue_id: venueId,
    date: bookingDate,
    time_slots: [selectedSlot.start, selectedSlot.end],
    people_count: studentIds.length,
    contact_phone: contactPhone,
    student_ids: studentIds,
  };

  console.log("📤 Booking Payload:", payload);

  try {
    const res = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ 預約成功！");
      loadAvailableSlots(venueId, bookingDate, slotContainer, (id, start, end) => {
        selectedSlot.id = id; selectedSlot.start = start; selectedSlot.end = end;
      });
    } else {
      alert(`❌ 預約失敗：${data.detail || "未知錯誤"}`);
    }
  } catch (err) {
    console.error("提交預約錯誤", err);
    alert("系統發生錯誤，請稍後再試。");
  }
}

// 綁定事件
document.addEventListener('DOMContentLoaded', () => {
  const venueId = 4;
  const today = new Date().toISOString().split('T')[0];

  const dateInput = document.getElementById('booking-date');
  const slotContainer = document.getElementById('time-slots-container');
  const peopleCountInput = document.getElementById('people-count');
  const studentIdContainer = document.getElementById('student-id-inputs');
  const submitBtn = document.getElementById('submit-booking');

  let selectedSlot = { id: null, start: null, end: null };

  dateInput.setAttribute('min', today);
  dateInput.value = today;

  peopleCountInput.addEventListener('change', () => {
    updateStudentIdInputs(parseInt(peopleCountInput.value, 10), studentIdContainer);
  });

  submitBtn.addEventListener('click', () => {
    handleBooking(venueId, dateInput, peopleCountInput, studentIdContainer, slotContainer, selectedSlot);
  });

  updateStudentIdInputs(parseInt(peopleCountInput.value, 10), studentIdContainer);
  loadAvailableSlots(venueId, dateInput.value, slotContainer, (id, start, end) => {
    selectedSlot.id = id; selectedSlot.start = start; selectedSlot.end = end;
  });

  dateInput.addEventListener('change', () => {
    loadAvailableSlots(venueId, dateInput.value, slotContainer, (id, start, end) => {
      selectedSlot.id = id; selectedSlot.start = start; selectedSlot.end = end;
    });
  });
});

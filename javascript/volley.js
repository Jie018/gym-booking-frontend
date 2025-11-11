// basketball.js - 排球場預約
const API_BASE = "https://gym-booking-backend-1.onrender.com";
// ====== 場地人數限制設定 ======
const venuePeopleLimits = {
  5: { min: 6, max: 12 } // 排球場
};

// 秒數 → "HH:MM"
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}`;
}

// 產生學號輸入欄位
function updateStudentIdInputs() {
  const count = parseInt(document.getElementById('people-count').value);
  const container = document.getElementById('student-id-inputs');
  container.innerHTML = '';
  if (isNaN(count) || count <= 0) return;

  for (let i = 0; i < count; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input student-id';
    input.placeholder = `請輸入第 ${i + 1} 位學生學號`;
    container.appendChild(input);
  }
}

// 載入可預約時段
function loadAvailableSlots() {
  const date = document.getElementById('booking-date').value;
  const venueId = 5; // 排球場
  const container = document.getElementById('time-slots-container');
  container.innerHTML = '';

  if (!date) return;
fetch(`${API_BASE}/api/available_slots?venue_id=${venueId}&date=${date}`) 
  .then(async (res) => {
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || '載入可預約時段失敗');

    // 後端回傳物件，所以直接檢查 data.slots
    if (!data.slots || data.slots.length === 0) {
      container.innerHTML = '<p>此日無可預約時段。</p>';
      return;
    }

    data.slots.forEach(slot => {
      const startHHMM = formatTime(slot.start_time);
      const endHHMM   = formatTime(slot.end_time);

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'time_slot';
      input.value = `${startHHMM}|${endHHMM}`;
      input.id = `slot_${slot.id}`;

      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.style.display = 'block';
      label.style.cursor = 'pointer';
      label.style.padding = '8px 0';
      label.textContent = `${startHHMM} - ${endHHMM}`;

      label.insertBefore(input, label.firstChild);
      container.appendChild(label);
    });
  })
  .catch(err => {
    console.error(err);
    container.innerHTML = '<p>無法載入時段，請稍後重試。</p>';
  });

}

// 送出預約
function handleBooking() {
  const bookingDate = document.getElementById('booking-date').value;
  const peopleCount = parseInt(document.getElementById('people-count').value);
  const studentIds = Array.from(document.querySelectorAll('.student-id')).map(i => i.value.trim());
  const contactPhone = document.getElementById('contact-phone').value.trim();

  const userIdRaw = localStorage.getItem('user_id');
  const userId = userIdRaw ? Number(userIdRaw) : null;
  if (!userId) {
    alert('請先登入再預約');
    window.location.href = 'login.html';
    return;
  }

  //電話號碼格式確認
  const phone = document.getElementById('contact-phone').value.trim();
  const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;

  if (!phoneRegex.test(phone)) {
    alert("電話格式錯誤，請輸入 09xx-xxx-xxx 或 09xxxxxxxx");
    return;
  }

  //學號格式確認
  const studentRegex = /^4\d{8}$/; // 第一個數字固定 4

  if (studentIds.some(id => !/^4\d{8}$/.test(id.toUpperCase()))) {
    alert("學號格式錯誤，每位學生必須輸入 4 開頭 + 8 個數字（共 9 碼）");
    return;
  }
  
  // ✅ 新增場地人數限制檢查
  const limits = venuePeopleLimits[3]; // 排球場
  if (limits && (peopleCount < limits.min || peopleCount > limits.max)) {
    alert(`排球場人數需介於 ${limits.min} ~ ${limits.max} 人之間`);
    return;
  }

  if (!bookingDate || isNaN(peopleCount) || peopleCount <= 0 || !contactPhone) {
    alert('請確認：日期、人數、電話都已填寫');
    return;
  }
  if (studentIds.length !== peopleCount || studentIds.some(id => id === "")) {
    alert('請輸入所有學號，數量需與人數一致');
    return;
  }

  const selected = document.querySelector('input[name="time_slot"]:checked');
  if (!selected) {
    alert('請選擇一個時段');
    return;
  }

  const [startHHMM, endHHMM] = selected.value.split('|');
  if (!startHHMM || !endHHMM) {
    alert('時段格式錯誤，請重新選擇！');
    return;
  }

  const bookingData = {
    user_id: userId,
    venue_id: 5, // 排球場
    date: bookingDate,
    time_slots: [startHHMM, endHHMM],
    people_count: peopleCount,
    contact_phone: contactPhone,
    student_ids: studentIds
  };

   console.log("📤 排球場 Booking 資料即將送出：", bookingData);

  fetch(`${API_BASE}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
  .then(async (r) => {
    const res = await r.json();
    if (!r.ok) throw res;  // ✅ 只修改這裡，直接丟物件
    alert('排球場預約成功！');
    window.location.reload();
})
.catch(err => {
    console.error(err);
    let msg = err.detail || "預約失敗";  // ✅ 只修改這裡，取 detail
    alert(msg);
});
}

// 綁定事件
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

  // ===== 載入可預約時段 =====
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

        // 若時段已過，禁用並加上提示
        if (endTime <= now) {
          slotBtn.disabled = true;
          slotBtn.classList.add("slot-disabled");
          slotBtn.title = "此時間段已過無法預約"; // ✅ hover 顯示文字
        }

        slotBtn.addEventListener("click", () => {
          document.querySelectorAll(".slot-btn.selected").forEach(btn => btn.classList.remove("selected"));
          slotBtn.classList.add("selected");
          selectedSlotId = slot.id;
        });

        slotContainer.appendChild(slotBtn);
      });
    } catch (err) {
      console.error("刷新可預約時段失敗", err);
      slotContainer.innerHTML = "<p>載入時段失敗，請稍後重試。</p>";
    }
  }

  // 時間格式轉換
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  // ===== 提交預約 =====
  async function handleBooking() {
    const date = dateInput.value;
    const phone = document.getElementById("contact-phone")?.value;
    const studentIds = Array.from(document.querySelectorAll(".student-id")).map(i => i.value);

    // 檢查是否選擇時段
    if (!selectedSlotId) {
      alert("請先選擇一個可預約時段！");
      return;
    }

    // ✅ 驗證電話格式
    const phoneRegex = /^09\d{2}-?\d{3}-?\d{3}$/;
    if (!phoneRegex.test(phone)) {
      alert("電話格式錯誤，請輸入 09xx-xxx-xxx 或 09xxxxxxxx");
      return;
    }

    // ✅ 驗證學號格式
    const studentRegex = /^4\d{8}$/;
    for (let i = 0; i < studentIds.length; i++) {
      if (!studentRegex.test(studentIds[i])) {
        alert("學號格式錯誤，每位學生必須輸入 4 開頭 + 8 個數字（共 9 碼）");
        return;
      }
    }

    const payload = {
      venue_id: venueId,
      slot_id: selectedSlotId,
      date: date,
      phone: phone,
      student_ids: studentIds,
    };

    try {
      const res = await fetch(`${API_BASE}/api/reservations`, {
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

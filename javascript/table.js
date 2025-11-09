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

// 載入可預約時段
function loadAvailableSlots() {
  const date = document.getElementById('booking-date').value;
  const venueId = 4; // 桌球場
  const container = document.getElementById('time-slots-container');
  container.innerHTML = '';

  if (!date) return;
  const API_BASE = 'https://gym-booking-backend-1.onrender.com'; 
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
  const venueId = 4;

  // 從登入資訊取得 user_id
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
  
  // 驗證人數限制
  const limits = venuePeopleLimits[venueId] || { min: 1, max: 10 };
  if (peopleCount < limits.min || peopleCount > limits.max) {
    alert(`人數需介於 ${limits.min} ~ ${limits.max} 人`);
    return;
  }

  // 基本檢查
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
    venue_id: venueId,
    date: bookingDate,
    time_slots: [startHHMM, endHHMM],
    people_count: peopleCount,
    contact_phone: contactPhone,
    student_ids: studentIds
  };

  console.log("📤 桌球場 Booking 資料即將送出：", bookingData);

  fetch(`${API_BASE}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
  .then(async (r) => {
    const res = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(res, null, 2));
    alert('桌球場預約成功！');
    window.location.reload();
  })
  .catch(err => {
    console.error(err);
    alert(JSON.stringify(err, null, 2));
  });
}

// 綁定事件
document.addEventListener('DOMContentLoaded', () => {
  const venueId = 4;
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('booking-date');
  dateInput.setAttribute('min', today);
  dateInput.value = today;

  updatePeopleInputLimit(venueId);

  const submitBtn = document.getElementById('submit-booking');
  if (submitBtn) submitBtn.addEventListener('click', handleBooking);

  const peopleCountInput = document.getElementById('people-count');
  if (peopleCountInput) {
    peopleCountInput.addEventListener('change', () => {
      updateStudentIdInputs();
      updatePeopleInputLimit(venueId);
    });
  }

  const datePicker = document.getElementById('booking-date');
  if (datePicker) datePicker.addEventListener('change', loadAvailableSlots);

  updateStudentIdInputs();
  loadAvailableSlots();
});

// badminton.js

// 🔧 秒數 → "HH:MM"
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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

// 🔧 載入可預約時段（後端回傳的 start_time/end_time 若為「秒數」就用 formatTime）
function loadAvailableSlots() {
  const date = document.getElementById('booking-date').value;
  const venueId = 2; // 羽球場 ID
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
  const bookingDate  = document.getElementById('booking-date').value;
  const peopleCount  = parseInt(document.getElementById('people-count').value);
  const studentIds   = Array.from(document.querySelectorAll('.student-id')).map(i => i.value.trim());
  const contactPhone = document.getElementById('contact-phone').value.trim();

  // 🔧 從登入流程儲存的 localStorage 取 user_id
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
    user_id: userId,          // 🔧 一定要帶
    venue_id: 2,              // 羽球場
    date: bookingDate,        // "YYYY-MM-DD"
    time_slots: [startHHMM, endHHMM], // 🔧 傳 "HH:MM"
    people_count: peopleCount,
    contact_phone: contactPhone,
    student_ids: studentIds
  };

  console.log("📤 Badminton Booking 資料即將送出：", bookingData);

  fetch(`${API_BASE}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
  .then(async (r) => {
    const res = await r.json();
    if (!r.ok) throw new Error(res.detail || res.message || '預約失敗');
    alert('羽球場預約成功！');
    window.location.reload();
  })
  .catch(err => {
    console.error(err);
    alert(err.message || '發送錯誤，請稍後再試');
  });
}

// 綁定事件（確保 DOM 已載入後再綁）
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('booking-date');
  dateInput.setAttribute('min', today);
  dateInput.value = today;

  // 🔧 事件綁定 id 要跟 HTML 一致：submitBooking（駝峰）
  document.getElementById('submitBooking').addEventListener('click', handleBooking);
  document.getElementById('people-count').addEventListener('change', updateStudentIdInputs);
  document.getElementById('booking-date').addEventListener('change', loadAvailableSlots);

  updateStudentIdInputs();
  loadAvailableSlots(); // 預設今天就載一次
});

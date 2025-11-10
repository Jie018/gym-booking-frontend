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
    if (!r.ok) throw res;  // ✅ 只修改這裡，直接丟物件
    alert('桌球場預約成功！');
    window.location.reload();
})
.catch(err => {
    console.error(err);
    let msg = err.detail || "預約失敗";  // ✅ 只修改這裡，取 detail
    alert(msg);
});
}

// 綁定事件
// document.addEventListener('DOMContentLoaded', () => {
//   const today = new Date().toISOString().split('T')[0];
//   const dateInput = document.getElementById('booking-date');
//   dateInput.setAttribute('min', today);
//   dateInput.value = today;

//   const submitBtn = document.getElementById('submit-booking');
//   if (submitBtn) submitBtn.addEventListener('click', handleBooking);

//   const peopleCountInput = document.getElementById('people-count');
//   if (peopleCountInput) peopleCountInput.addEventListener('change', updateStudentIdInputs);

//   const datePicker = document.getElementById('booking-date');
//   if (datePicker) datePicker.addEventListener('change', loadAvailableSlots);

//   updateStudentIdInputs();
//   loadAvailableSlots();
// });

// 綁定事件
document.addEventListener('DOMContentLoaded', () => {
  const venueId = 4;
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('booking-date');
  const venueSelect = document.getElementById('venue-select');
  const dateSelect = document.getElementById('booking-date');
  const slotContainer = document.getElementById('slots-container');

  // ===== 防呆：檢查 DOM 元素是否存在 =====
  console.log("DEBUG DOM:", {
    dateInputExists: !!dateInput,
    venueSelectExists: !!venueSelect,
    dateSelectExists: !!dateSelect,
    slotContainerExists: !!slotContainer
  });

  // 如果任何必要元素不存在，印出更詳細錯誤並停止
  if (!dateInput || !venueSelect || !dateSelect || !slotContainer) {
    console.error("DEBUG ERROR: 某些必要 DOM 元素不存在，請確認 HTML 中有 id=booking-date / id=venue-select / id=slots-container");
    return;
  }

  // 設初始日期
  dateInput.setAttribute('min', today);
  dateInput.value = today;

  async function loadAvailableSlots() {
    console.log("DEBUG: loadAvailableSlots() called");
    // 使用固定 venueId（你說每個場地 JS 都固定一個 ID）
    const useVenueId = venueId; // 固定 ID
    const date = dateSelect.value;
    console.log("DEBUG params:", { API_BASE, useVenueId, date });

    if (!useVenueId || !date) {
      console.warn("DEBUG: venueId 或 date 為空，將不發送請求", { useVenueId, date });
      // 顯示提示給使用者
      slotContainer.innerHTML = "<p>請先選擇日期或場地。</p>";
      return;
    }

    const url = `${API_BASE}/api/available_slots?venue_id=${useVenueId}&date=${date}`;
    console.log("DEBUG fetch URL:", url);

    try {
      const res = await fetch(url);
      console.log("DEBUG fetch response status:", res.status);
      const slots = await res.json();
      console.log("DEBUG fetch response body:", slots);

      slotContainer.innerHTML = ""; // 清空舊的時段

      if (!slots || slots.length === 0) {
        slotContainer.innerHTML = "<p>此日尚無預約時段</p>";
        return;
      }

      const now = new Date();

      slots.forEach(slot => {
        const slotBtn = document.createElement("button");
        slotBtn.className = "slot-btn";

        const startTime = new Date(`${date}T${slot.start_time}`);
        const endTime = new Date(`${date}T${slot.end_time}`);

        slotBtn.textContent = `${slot.start_time} - ${slot.end_time}`;

        if (endTime <= now || (startTime.getDate() === now.getDate() && endTime.getHours() >= 21)) {
          slotBtn.disabled = true;
          slotBtn.style.backgroundColor = "#e2e3e5";
          slotBtn.style.color = "#6c757d";
          slotBtn.title = "此時段已不可預約";
        }

        slotContainer.appendChild(slotBtn);
      });
    } catch (err) {
      console.error("刷新可預約時段失敗", err);
      slotContainer.innerHTML = "<p>載入時段失敗，請稍後重試。</p>";
    }
  }

  // 監聽場地或日期變化
  if (venueSelect) venueSelect.addEventListener("change", loadAvailableSlots);
  if (dateSelect) dateSelect.addEventListener("change", loadAvailableSlots);

  // 初次載入：先更新 UI control，再載入時段
  updateStudentIdInputs();
  updatePeopleInputLimit(venueId);
  loadAvailableSlots();

  // 綁定其他事件（不變）
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
});


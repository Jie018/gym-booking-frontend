// document.addEventListener("DOMContentLoaded", () => {
//   const userId = localStorage.getItem("user_id");
//   const noLogin = document.getElementById("no-login");
//   const recordsSection = document.getElementById("records-section");
//   const tbody = document.getElementById("records-body");

//   // 若未登入則顯示提示
//   if (!userId) {
//     noLogin.style.display = "block";
//     return;
//   }

//   recordsSection.style.display = "block";
//   const API_BASE = "http://127.0.0.1:8000";

//   // 取得使用者預約紀錄
//   fetch(`${API_BASE}/api/my_reservations?user_id=${userId}`)
//     .then((res) => res.json())
//     .then((data) => {
//       const reservations = data.reservations || [];
//       console.log(reservations);

//       if (reservations.length === 0) {
//         tbody.innerHTML = `<tr><td colspan="9">目前沒有任何預約紀錄。</td></tr>`;
//         return;
//       }

//       tbody.innerHTML = "";

//       reservations.forEach((r) => {
//         const tr = document.createElement("tr");
//         tr.innerHTML = `
//             <td>${r.start_time ? new Date(r.start_time).toLocaleDateString() : "-"}</td>
//             <td>${r.venue_name || "未知場地"}</td>
//             <td>${r.start_time ? new Date(r.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" , hour12: false}) : "-"}</td>
//             <td>${r.end_time ? new Date(r.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" , hour12: false}) : "-"}</td>
//             <td>${r.people_count ?? ""}</td>
//             <td>${r.contact_phone ?? ""}</td>
//             <td class="status-${r.status}">${r.status ?? "未指定"}</td>
//             <td>
//             ${
//               r.status === "預約成功" || r.status === "審核中"
//               ? `<button class="cancel-btn" data-id="${r.booking_id}" data-starttime="${r.start_time}">取消</button>`
//               : ""
//             }
//             </td>
//         `;
//         tbody.appendChild(tr);

//         // 取得當前生成的按鈕
//         const btn = tr.querySelector(".cancel-btn");
//         if (btn) {
//           const startTime = new Date(btn.dataset.starttime);
//           const now = new Date();

//           // 過期按鈕禁用
//           if (startTime < now) {
//             btn.disabled = true;
//             btn.style.backgroundColor = "gray";
//             btn.title = "此時段已過，無法取消";
//           }

//           // 綁定取消事件
//           btn.addEventListener("click", async (e) => {
//             if (startTime < now) {
//               alert("此時段已過，取消失敗");
//               return;
//             }

//             const id = btn.dataset.id;
//             if (!confirm("確定要取消這筆預約嗎？")) return;

//             try {
//               const res = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, {
//                 method: "PUT"
//               });
//               const data = await res.json();
//               if (!res.ok) throw new Error(data.detail || "取消失敗");

//               alert("取消成功！");
//               location.reload();
//             } catch (err) {
//               console.error(err);
//               alert("取消失敗，請稍後再試。");
//             }
//           });
//         }
//       });
//     })
//     .catch((err) => {
//       console.error(err);
//       tbody.innerHTML = `<tr><td colspan="9">載入失敗，請稍後重試。</td></tr>`;
//     });
// });
document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");
  const noLogin = document.getElementById("no-login");
  const recordsSection = document.getElementById("records-section");
  const tbody = document.getElementById("records-body");
  const API_BASE = "http://127.0.0.1:8000";

  // 若未登入則顯示提示
  if (!userId) {
    noLogin.style.display = "block";
    return;
  }

  recordsSection.style.display = "block";

  // 取得使用者預約紀錄
  fetch(`${API_BASE}/api/my_reservations?user_id=${userId}`)
    .then((res) => res.json())
    .then((data) => {
      const reservations = data.reservations || [];
      console.log(reservations);

      if (reservations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9">目前沒有任何預約紀錄。</td></tr>`;
        return;
      }

      tbody.innerHTML = "";
      reservations.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.start_time ? new Date(r.start_time).toLocaleDateString() : "-"}</td>
          <td>${r.venue_name || "未知場地"}</td>
          <td>${r.start_time ? new Date(r.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "-"}</td>
          <td>${r.end_time ? new Date(r.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "-"}</td>
          <td>${r.people_count ?? ""}</td>
          <td>${r.contact_phone ?? ""}</td>
          <td class="status-${r.status}">${r.status ?? "未指定"}</td>
          <td>
            ${
              r.status === "預約成功" || r.status === "審核中"
                ? `<button class="cancel-btn" data-id="${r.booking_id}" data-starttime="${r.start_time}">取消</button>`
                : ""
            }
          </td>
        `;
        tbody.appendChild(tr);
      });

      // 綁定取消按鈕事件
      document.querySelectorAll(".cancel-btn").forEach((btn) => {
        const startTime = new Date(btn.dataset.starttime);
        const now = new Date();

        if (startTime < now) {
          btn.disabled = true;
          btn.style.backgroundColor = "gray";
          btn.title = "此時段已過，無法取消";
        }

        btn.addEventListener("click", async (e) => {
          if (startTime < now) {
            alert("此時段已過，取消失敗");
            return;
          }

          const id = e.target.dataset.id;
          if (!confirm("確定要取消這筆預約嗎？")) return;

          try {
            const res = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, { method: "PUT" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "取消失敗");

            alert("取消成功！");
            btn.disabled = true;
            btn.style.backgroundColor = "gray";

            // ===== 取消後刷新可預約時段 =====
            refreshAvailableSlots();
            // =================================
          } catch (err) {
            console.error(err);
            alert("取消失敗，請稍後再試。");
          }
        });
      });
    })
    .catch((err) => {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="9">載入失敗，請稍後重試。</td></tr>`;
    });

  // ===== 函式：刷新可預約時段 =====
  async function refreshAvailableSlots() {
    const venueId = document.getElementById("venue-select")?.value;
    const date = document.getElementById("date-select")?.value;
    if (!venueId || !date) return;

    try {
      const res = await fetch(`${API_BASE}/api/available_slots?venue_id=${venueId}&date=${date}`);
      const slots = await res.json();

      const slotContainer = document.getElementById("slots-container");
      if (!slotContainer) return;

      slotContainer.innerHTML = ""; // 清空舊的時段
      slots.forEach((slot) => {
        const slotBtn = document.createElement("button");
        slotBtn.textContent = `${slot.start_time} - ${slot.end_time}`;
        slotBtn.className = "slot-btn";
        slotContainer.appendChild(slotBtn);
      });
    } catch (err) {
      console.error("刷新可預約時段失敗", err);
    }
  }
  // ===================================
});

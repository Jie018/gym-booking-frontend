document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://127.0.0.1:8000/api";
    const tbody = document.querySelector("#adminTable tbody");
    const noRecord = document.getElementById("noRecord");

    // 取得待審核預約
    async function loadPendingReservations() {
        try {
            const res = await fetch(`${API_BASE}/bookings/pending`);
            const data = await res.json();
            const reservations = data.bookings || [];

            tbody.innerHTML = "";
            if (reservations.length === 0) {
                noRecord.style.display = "block";
                return;
            } else {
                noRecord.style.display = "none";
            }

            reservations.forEach(r => {
                let statusClass = "";
                switch(r.status) {
                    case "審核中": statusClass = "status-pending"; break;
                    case "已取消": statusClass = "status-cancelled"; break;
                    case "已通過": statusClass = "status-approved"; break;
                    case "已拒絕": statusClass = "status-rejected"; break;
                    default: statusClass = "";
                }

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${new Date(r.created_at).toLocaleString()}</td>
                    <td>${r.username}</td>
                    <td>${r.venue_name}</td>
                    <td>${new Date(r.start_time).toLocaleDateString()}</td>
                    <td>${new Date(r.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})} - ${new Date(r.end_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})}</td>
                    <td>${r.people_count}</td>
                    <td>
                      ${r.student_ids.split(',').map(id => `<span class="student-badge">${id}</span>`).join(' ')}
                    </td>
                    <td>${r.contact_phone}</td>
                    <td class="${statusClass}">${r.status}</td>
                    <td>
                        <button class="approve-btn" data-id="${r.booking_id}">通過</button>
                        <button class="reject-btn" data-id="${r.booking_id}">拒絕</button>
                    </td>
                `;
                tbody.appendChild(tr);

                // 綁定按鈕事件
                tr.querySelector(".approve-btn").onclick = async () => {
                    try {
                        const res = await fetch(`${API_BASE}/bookings/${r.booking_id}/approve`, {method:"PUT"});
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.detail || data.message || "操作失敗");
                        alert(data.message);
                        await loadPendingReservations();
                    } catch(err) {
                        console.error(err);
                        alert(err.message || "操作失敗");
                    }
                };

                tr.querySelector(".reject-btn").onclick = async () => {
                    try {
                        const res = await fetch(`${API_BASE}/bookings/${r.booking_id}/reject`, {method:"PUT"});
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.detail || data.message || "操作失敗");
                        alert(data.message);
                        await loadPendingReservations();
                    } catch(err) {
                        console.error(err);
                        alert(err.message || "操作失敗");
                    }
                };
            });

        } catch (err) {
            console.error(err);
            alert("無法載入待審核預約，請檢查後端是否啟動或 API 路徑是否正確");
        }
    }

    loadPendingReservations();
});

async function loadNews() {
    try {
        const res = await fetch("https://gym-booking-backend-1.onrender.com/api/news");
        const news = await res.json();

        displayAnnouncements(news);
        updateTime();
    } catch (err) {
        document.getElementById("announcementList").innerHTML =
            "<div style='text-align:center;padding:40px;color:#c33;'>❌ 無法載入最新消息，請稍後再試。</div>";
    }
}

function displayAnnouncements(list) {
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    document.getElementById("announcementList").innerHTML = list
        .map(item => `
            <div class="announcement-item" onclick="window.open('${item.url}', '_blank')">
                <div class="announcement-header">
                    <span class="announcement-badge">${item.category || '公告'}</span>
                    <span class="announcement-date">${item.date}</span>
                </div>
                <div class="announcement-title-row">
                    <span class="announcement-icon">📄</span>
                    <div class="announcement-title">${item.title}</div>
                </div>
                <div class="announcement-summary">請點擊查看完整內容。</div>
                <span class="view-more">查看詳情 →</span>
            </div>
        `)
        .join("");
}

function updateTime() {
    const now = new Date();
    const t = now.toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
    document.getElementById("updateTime").textContent = t;
}

loadNews();

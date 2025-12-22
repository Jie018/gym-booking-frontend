# 借易場 E-Court (靜宜大學體育館租借平台)

本專案為校園體育館場地預約系統，使用者可線上查詢、預約與取消場地；管理員可管理可預約時段與審核預約紀錄。平台前後端分離，整合 PostgreSQL 資料庫。

---

## 🏗 專案架構

### 前端

- **技術**：HTML、CSS、JavaScript、Bootstrap
- **功能**：
  - 使用者登入 / 註冊
  - 查詢場地可預約時間
  - 預約 / 取消場地
  - 動態更新 UI 與可用時段
- **檔案說明**：
  - `index.html`：首頁，顯示資訊與導覽
  - `login.html`：登入頁面
  - `web.html`：預約平台頁面
  - `css\`：前端樣式
  - `js\`：前端互動與 fetch API

---

### 後端

- **技術**：Python、FastAPI、PostgreSQL
- **功能**：
  - 使用者註冊與登入驗證
  - 場地時段管理（AvailableSlot）
  - 預約管理（Bookings）
  - 提供 RESTful API 給前端使用
- **檔案說明**：
  - `main.py`：FastAPI 主程式
  - `routers/`：各功能路由模組
    - `users.py`：使用者登入/註冊
    - `bookings.py`：場地預約管理
  - `models.py`：資料庫模型 (SQLAlchemy)
  - `database.py`：資料庫連線設定

---

## ⚡資料庫說明

- **資料表**：
  - `users`：使用者資訊（帳號、信箱、密碼）
  - `venues`：場地資訊
  - `available_slots`：場地可預約時間
  - `bookings`：使用者預約紀錄

---

## 🖱️ 使用方法

1. Clone Repo：
```bash
git clone https://github.com/Jie018/gym-booking-frontend.git
````

2. 前端：

* 打開 `index.html` 開始使用（建議配合後端 API 執行）

3. 後端：
* 開啟Render並啟動後端服務
```bash
cd backend
uvicorn main:app --reload
```

4. 註冊帳號，登入後即可進行場地預約

---
## 🔗 Demo
[影片連結以及專案網址]
影片連結:https://youtu.be/w_xFJj8o39g
專案網址:https://easycourt-booking.vercel.app/

### 技術重點

 📌前後端分離架構

 📌RESTful API 設計

 📌PostgreSQL 資料庫整合

 📌前端響應式 UI 與動態資料呈現

 📌Git 版本控制與團隊協作
## 備註

* 後端使用 `mysql.connector` 或 SQLAlchemy 連接PostgreSQL資料庫
* 前端使用 `fetch` 與後端 API 溝通
* 本專案適合學校專題或個人練習使用
*目前Demo影片可完整展示功能，實際登入需啟動後端服務
---

```

---

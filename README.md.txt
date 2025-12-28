# 借易場 E-Court (靜宜大學體育館租借平台)

獨立開發之「體育館場地預約系統」，實作前後端分離架構，支援使用者預約流程與管理員時段管理，完整涵蓋系統設計、API 開發與資料庫建模。  
平台採 **前後端分離架構**，負責系統架構設計、前端介面開發、後端 API 實作、資料庫設計與前後端整合。

---

## 🏗 專案架構

### 前端

- **技術**：HTML、CSS、JavaScript、Bootstrap
  - 實作登入狀態管理、預約流程 UI 與即時可預約時段顯示
  - 使用 fetch API 串接後端 RESTful API，動態更新畫面

---

### 後端

- **技術**：Python、FastAPI、PostgreSQL
  - 設計 RESTful API（使用者登入、場地查詢、預約建立與取消）
  - 實作使用者驗證、資料驗證與預約狀態管理流程
  - 使用 SQLAlchemy ORM 建立資料模型與資料表關聯

---

## ⚡資料庫說明

- **資料表**：
  - PostgreSQL，設計 users / venues / available_slots / bookings 等資料表
  - 使用外鍵建立使用者、場地與預約紀錄關聯
---

---
## 🔗 Demo
- 專案網站：https://easycourt-booking.vercel.app/
- 功能展示影片：https://youtu.be/w_xFJj8o39g

### 技術重點

- Frontend / Backend 分離式架構
- RESTful API 設計與實作
- SQLAlchemy ORM 與 PostgreSQL 資料庫整合
- 動態預約流程與狀態管理
- Git 版本控制

## 備註
* 熟悉 SQLAlchemy 操作 PostgreSQL，並具備 MySQL 使用經驗
* 前端透過 fetch API 與後端進行資料交換
* 本專案適合學校專題或個人練習使用
* 目前Demo影片可完整展示功能，實際登入需啟動後端服務
---

```

---

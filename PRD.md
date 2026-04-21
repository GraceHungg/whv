# 產品需求規格書 (PRD) - WHV Life Beta Test v1.1

## 1. 產品概述 (Product Overview)
**WHV Life** 是一個專為「打工度假 (Working Holiday)」設計的智能決策支援系統。有別於傳統的靜態資訊網站，本產品導入了全端網路爬蟲與 LLM (大型語言模型) 語意分析技術。使用者可貼入各大社群論壇（Dcard、PTT 等）的討論串網址，系統會自動擷取網友留言，過濾情緒性雜訊，並動態將最新觀點融入各國的決策儀表板中，幫助使用者做出最符合自身偏好（如：日照需求、氣候適應、社交平衡）的選擇。

## 2. 核心設計系統 (Design System)
本專案全面採用 **Neumorphism (Soft UI / 擬物化)** 設計風格，強調介面的實體感與材質感：
- **全局基底色**：`#E0E5EC`（冷調灰白色），所有元件與背景一體成型。
- **立體光影機制**：
  - **凸起 (Extruded)**：用於卡片 (`.neu-card`)、按鈕 (`.neu-button`)，左上打亮、右下深灰陰影。
  - **內凹 (Inset)**：用於輸入框 (`.neu-input`)、圖示底座 (`.neu-icon-well`)，營造按壓或雕刻深度。
- **字體排版**：採用 Google Fonts (`Plus Jakarta Sans` 為標題，`DM Sans` 為內文)，確保高對比度與現代感。

## 3. 系統架構與技術棧 (System Architecture)
採用前後端分離的全端架構：
- **前端 (Frontend)**：React 19 + Vite + Tailwind CSS v4。負責狀態管理、UI 渲染與動態資料綁定。
- **後端 (Backend)**：Node.js + Express。
- **爬蟲引擎 (Scraper)**：Puppeteer。具備基礎防阻擋設定（偽裝 User-Agent、模擬人類滾動延遲）。
- **AI 分析引擎 (AI Engine)**：Google Gemini 2.5 Flash API。強制輸出格式化 JSON。

## 4. 核心功能模組 (Core Features)

### 4.1 靜態基準資料庫 (Baseline Knowledge)
- 系統內建多國（澳、紐、加、英、愛、荷、捷、法、比）的客觀基準資料，包含簽證費、日照指數、申請時程等，確保系統在無探勘狀態下仍具備基礎參考價值。

### 4.2 批次網址深度探勘 (Batch AI Scraping)
- **去重機制**：前端自動過濾空白與重複輸入的 URL，避免浪費伺服器與 API 資源。
- **自動化抓取**：後端接收 URL 後，啟動無頭瀏覽器，動態等待 DOM 載入與滾動，擷取完整討論串與留言純文字。

### 4.3 AI 衝突觀點處理與收斂 (AI Conflict Resolution)
- 透過嚴格的 System Prompt 要求 AI 執行以下邏輯：
  1. **衝突並陳**：遇到網友正反意見（如：好找工作 vs 找不到工作），強制分別列入優缺點，或標示為「爭議點」。
  2. **過濾雜訊**：自動忽略無具體事實的情緒性謾罵。
  3. **動態發現**：若討論串提及預設清單外的國家（如：日本），AI 需自動整理並回傳該國資料。

### 4.4 智慧資料融合與呈現 (Dynamic Data Merging)
- **全新國家生成**：直接在前端產生新的標籤頁與國家卡片。
- **既有國家更新 (Deep Merge)**：
  - 保留既有客觀欄位（如簽證費、國旗）。
  - 將 AI 判讀出的新優點/缺點與舊有優缺點**去重複並合併**。
  - 將最新的「文章摘要（包含來源網址與留言數）」**向下堆疊追加**，不覆蓋歷史探勘紀錄。
- **視覺回饋**：探勘成功後，強制彈出 Modal 提示使用者抓取到的國家數量與名單。

## 5. 狀態與資料流設計 (State Management)
前端 `App.jsx` 集中管理核心狀態：
- `urls` (String): 使用者輸入的網址原始字串。
- `queue` (Array): 視覺化進度條列。
- `analysisData` (Object): 存放所有被 AI 探勘出來的「文章摘要與評分紀錄」，每次探勘採深層合併 (`articles: [...old, ...new]`)。
- `countriesData` (Object): 負責渲染儀表板的最終物件。以 `INITIAL_COUNTRIES` 為基底，每次探勘後將 `analysisData` 的結論寫入更新。

## 6. 已知限制與未來擴充 (Constraints & Future Scope)
1. **進階反爬蟲限制**：Threads 等高度依賴前端渲染與防爬蟲機制的網站，偶爾仍會因無頭瀏覽器被導向登入頁面而抓取失敗。未來若需商用，建議串接官方 API 或專門的代理爬蟲服務（如 Apify）。
2. **長文本 Token 限制**：目前後端對爬取文本強制截斷在 `15000` 字元，以避免超出 LLM Context Window 上限或造成過高費用。
3. **資料持久化**：目前的 `countriesData` 僅存在記憶體中（重新整理即恢復預設）。下一階段可導入 LocalStorage 或 Firebase 進行使用者專屬資料儲存。

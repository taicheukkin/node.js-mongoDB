// 引入 express 及 helmet 模組
const express = require('express'); // 建立 HTTP 伺服器，處理請求和回應
// const helmet = require('helmet');   // 強化 HTTP 安全標頭，防止 XSS、Clickjacking 等攻擊

// 建立 Express 應用程式，處理 HTTP 請求
const app = express();

// 啟用所有 Helmet 內建的安全標頭，例如：
// X-Frame-Options: DENY → 禁止 iframe 嵌入，防止 Clickjacking
// Strict-Transport-Security → 強制 HTTPS 連線
// X-XSS-Protection → 啟用 XSS 防禦機制
// Content-Security-Policy (CSP) → 限制外部資源載入，加強安全性
// X-Content-Type-Options: nosniff → 防止內容類型偽裝攻擊
// app.use(helmet());

// 設定首頁路由
// 訪問 localhost:3000/ 時，回傳文字 「安全的 Express 伺服器」
app.get('/', (req, res) => {
    res.send(`沒有 helmet 中介的 Express 伺服器`);
});

// 啟動 Express 伺服器，並監聽 3001 端口，開始接受 HTTP 請求
app.listen(3001, () => console.log('伺服器運行於 http://localhost:3001'));



// ************************************************************************************
/*
Simple express app without helmet middleware

*/



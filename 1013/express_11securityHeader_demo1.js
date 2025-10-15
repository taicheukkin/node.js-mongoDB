// 引入 express 及 helmet 模組
const express = require('express'); // 建立 HTTP 伺服器，處理請求和回應
const helmet = require('helmet');   // 強化 HTTP 安全標頭，防止 XSS、Clickjacking 等攻擊

// 建立 Express 應用程式，處理 HTTP 請求
const app = express();

// 自訂 Helmet 配置 (自訂安全標頭)
app.use(helmet({
    // 設定 CSP（內容安全政策），限制資源的載入
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],                               // 限制所有資源只能來自自身網站
            styleSrc: ["'self'", "https://fonts.googleapis.com"], // 允許 Google Fonts 的 CSS
            scriptSrc: ["'self'", "'unsafe-inline'"]              // 允許內聯腳本，但仍需注意安全性
        }
    },
    frameguard: { action: 'deny' }, // 禁止網頁被嵌入到 iframe，防止 Clickjacking
    xssFilter: true,                // 啟用 XSS 過濾，阻止跨站腳本攻擊
    hidePoweredBy: true             // 隱藏 "X-Powered-By: Express" 標頭，以防止攻擊者知道技術細節
}));



// 設定首頁路由
// 訪問 localhost:3002/ 時，回傳文字 「安全的 Express 伺服器」
app.get('/', (req, res) => {
    res.send('引入自訂安全標頭 helmet 中介的 Express 伺服器');
});

// 啟動 Express 伺服器，並監聽 3002 端口，開始接受 HTTP 請求
app.listen(3002, () => console.log('伺服器運行於 http://localhost:3002'));



// ************************************************************************************
// ************************************************************************************
// source: Copilot 




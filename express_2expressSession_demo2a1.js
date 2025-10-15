// 引入 Express 框架及 express-session 中介
const express = require('express');          // 建立 Web 伺服器
const session = require('express-session');  // 用於管理 session

// 建立 Express 應用程式
const app = express();        // 用來處理 HTTP 請求

// express-session 的設定
// secret：用於簽署 session ID，防止篡改（務必使用安全的隨機字串）。
// resave：如果 session 未修改，則不強制儲存，提高效能。
// saveUninitialized：當 session 尚未初始化時，是否儲存它（一般設為 true）。
// cookie.secure：若網站使用 HTTPS，則應設為 true，讓 session cookie 只在安全連線中傳輸。
app.use(session({
  secret: process.env.SESSION_SECRET, // Session 的加密密鑰，防止被篡改。 已改成環境變數。
  // secret: process.env.SESSION_SECRET || 'default-secret', // Session 的加密密鑰，防止被篡改。 已改成環境變數。
  resave: false,                      // 如果沒有修改 Session，不會強制儲存，提升效能。
  saveUninitialized: false,           // 只有登入後才會建立 Session，避免浪費伺服器資源。
  cookie: { secure: false}             // cookie.secure 設為 true，上線時務必使用 HTTPS。
}));

// Express 處理 GET 請求的路由
// 當用戶訪問 '/' 時：如果 req.session.views 尚未設置，則初始化為 1。 如果已存在，則每次
// 請求都會遞增 views 計數。最後將計數回應給用戶，顯示瀏覽次數。
app.get('/', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`你已經瀏覽了 ${req.session.views} 次`);
});

app.listen(3000, () => console.log('伺服器運行於 http://localhost:3000'));


// ************************************************************************************
/* source: Copilot
// Cookies 可用於存儲用戶資訊，如身份驗證 token 或偏好設定。可使用 cookie-parser 來解析 cookies。
// Pending - further work

⚡ 改進建議
安全性
- secret 不要寫死在程式碼裡，改用環境變數： (already fixed)
js
secret: process.env.SESSION_SECRET || 'default-secret'

*/



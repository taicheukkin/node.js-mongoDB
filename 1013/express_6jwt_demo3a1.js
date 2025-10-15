// 引入相關模組
const express = require('express');  // 建立 HTTP 伺服器
const jwt = require('jsonwebtoken'); // 產生與驗證 JWT Token，確保安全的登入驗證
const path = require('path');        // 處理檔案路徑，例如載入 users2.json
const fs = require('fs');            // 讀取 JSON 檔案

// 建立 Express 應用
const app = express();               // 初始化 Express 應用程式
app.use(express.json());             // 讓 Express 解析 POST 請求的 JSON 數據
app.use(express.static(path.join(__dirname, 'public')));  // 提供靜態文件

// 定義 JWT 密鑰
const SECRET_KEY = 'your-secret-key';// 加密 Token 的密鑰，確保 Token 無法被篡改
let blacklist = [];                  // 黑名單列表，存儲 已登出 Token，防止其再次使用

// 讀取 JSON 用戶資料庫
// fs.readFileSync() → 同步讀取 users2.json，確保應用程式能取得用戶資料。
// JSON.parse(data) → 解析 JSON 字串，轉換為 JavaScript 物件。
// 檢查 users.json 結構 → 確保 JSON 內有 "users" 陣列，否則報錯。
function loadUsers() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'users2.json'), 'utf-8');
        const parsedData = JSON.parse(data);

        if (!Array.isArray(parsedData.users)) {
            throw new Error("users2.json 結構不正確，應包含 'users' 陣列");
        }

        return parsedData.users;
    } catch (error) {
        console.error("讀取用戶資料庫時發生錯誤:", error);
        return [];
    }
}

// 登入 API：檢查帳號 & 密碼，發送 JWT Token
// 讀取 users.json，檢查使用者輸入的 帳號 & 密碼 是否正確。
// 如果帳號匹配 → 回應 "登入成功" 並傳回 Token。 否則 → 回應 401 Unauthorized，顯示 "帳號或密碼錯誤"。
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  const user = users.find(user => user.username === username && user.password === password);

  if (user) {
    // jwt.sign() → 建立 Token，包含 username & role，有效期 1 小時。
    const token = jwt.sign({ username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: '登入成功', token });
  } else {
    res.status(401).json({ message: '帳號或密碼錯誤' });
  }
});

// 取得用戶資訊 API：驗證 Token，返回用戶資訊
app.get('/profile', (req, res) => {
  // 從 Authorization 標頭擷取 Token。 
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '未提供 Token' });

  // 檢查 Token 是否在黑名單 → 若已登出，回應 401 Unauthorized。
  if (blacklist.includes(token)) {
    return res.status(401).json({ message: 'Token 已失效，請重新登入' });
  }

  // 使用 jwt.verify() 驗證 Token → 確保 Token 有效且未被竄改。成功時回應用
  // 戶資訊，包括 username & role。
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ message: '用戶資訊', user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Token 無效' });
  }
});

// 登出 API：加入黑名單，防止已登出 Token 重新使用
app.post('/logout', (req, res) => {
  // 客戶端會發送 Authorization 標頭
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '未提供 Token' });

  // 將 Token 加入黑名單，讓它無法再次使用，並回應 "登出成功"
  blacklist.push(token);
  res.json({ message: '登出成功' });
});

// **啟動伺服器**
app.listen(3000, () => console.log('伺服器運行於 http://localhost:3000/login_jwt.html'));




// ************************************************************************************
/* source: Copilot 
// 登入 API, 取得用戶資訊 API, 登出 API


users2.json
***********************
{
  "users": [
    { "username": "alex", "password": "pass123", "role": "admin" },
    { "username": "yoyo", "password": "pass456", "role": "user" }
  ]
}
***********************
*/




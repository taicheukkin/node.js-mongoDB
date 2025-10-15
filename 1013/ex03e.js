// 引入必要的套件與模組
const express = require('express');                                 // 建立 HTTP 伺服器與路由
const fs = require('fs');                                           // 讀寫檔案（members.json）
const path = require('path');                                       // 處理檔案路徑
const { check, validationResult } = require('express-validator');   // 表單欄位驗證
const jwt = require('jsonwebtoken');                                // 產生與驗證 JWT
const bodyParser = require('body-parser');                          // 解析表單（urlencoded）請求

const app = express();                              // 建立 Express 應用
const port = 8080;                                  // 伺服器埠號

// 建議改為環境變數：JWT 加密用的密鑰
const JWT_SECRET = 'your-secret-key';

app.use(bodyParser.urlencoded({ extended: true }));         // 解析 x-www-form-urlencoded 表單資料
app.use(express.static(path.join(__dirname, 'public')));    // 提供 public 目錄的靜態檔案（HTML/CSS/JS）

// 顯示登入頁（使用改成 JWT 的登入頁檔案）
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign_in2_jwt.html'));
});

// 登入表單處理：驗證 + 簽發 JWT
app.post('/submit', [
    check('username')                                           // 驗證 username 欄位
        .trim()                                                 // 去除前後空白
        .notEmpty().withMessage('請輸入帳號')                    // 不得為空
        .isLength({ min: 3 }).withMessage('帳號至少 3 個字元'),  // 長度限制
    check('password')                                           // 驗證 password 欄位
        .notEmpty().withMessage('請輸入密碼')                    // 不得為空
        .isLength({ min: 4 }).withMessage('密碼至少 4 個字元')   // 長度限制
], (req, res) => {
    const errors = validationResult(req);                       // 收集驗證結果
    if (!errors.isEmpty()) {                                    // 若有錯誤，回傳 400 與錯誤訊息頁
        return res.status(400).send(`
            <h2>❌ 登入失敗</h2>
            <ul>${errors.array().map(e => `<li>${e.msg}</li>`).join('')}</ul>
            <p><a href="/login">返回登入頁</a></p>
        `);
    }

    const { username, password } = req.body;                    // 取得表單輸入
    const filePath = path.join(__dirname, 'members.json');      // 會員資料檔案位置

    fs.readFile(filePath, 'utf8', (err, data) => {              // 非同步讀取會員資料 JSON
        if (err) return res.status(500).send('讀取會員資料時發生錯誤');

        let members;
        try {
            members = JSON.parse(data);                         // 解析 JSON 字串為物件
        } catch {
            return res.status(500).send('會員資料格式錯誤');
        }

        const matched = Object.values(members).find(            // 比對帳號與密碼是否正確
            m => m.username === username && m.password === password
        );

        if (matched) {
            // 產生 JWT：payload 含 id 與 username，設定有效期 1 小時
            const token = jwt.sign(
                { id: matched.id, username: matched.username },
                JWT_SECRET,
                { expiresIn: '1h' }  // '60s'= 60 秒；'1m'= 1 分鐘；'7d' = 7 天
            );

        // 登入成功頁面：存 token 到 localStorage，並提供查看會員中心連結
        res.send(`
            <html>
            <head><meta charset="utf-8"><title>登入成功</title></head>
            <body>
                <h2>✅ 歡迎回來，${matched.username}！</h2>
                <p>您的會員 ID 是：${matched.id}</p>
                <p>系統已產生 JWT Token，並已自動儲存到 localStorage。</p>
                <p><a href="/">返回主頁</a></p>
                <p><a href="#" onclick="return goProfile()">查看會員中心</a></p>
                <p><a href="/logout">登出</a></p>

                <script>
                // 將 token 存入 localStorage，供後續 API 呼叫使用
                localStorage.setItem("jwtToken", "${token}");

                // 頁面載入時檢查 token 是否存在，不存在則導回登入頁
                window.onload = function() {
                    const token = localStorage.getItem("jwtToken");
                    if (!token) {
                    alert("尚未登入或 Token 已失效，請重新登入");
                    window.location.href = "/login";
                    }
                };

                // 點擊會員中心時：以 fetch 攜帶 Authorization Bearer token 呼叫 /profile
                function goProfile() {
                    const token = localStorage.getItem("jwtToken");
                    if (!token) {
                    alert("尚未登入或 Token 已失效，請重新登入");
                    window.location.href = "/login";
                    return false;
                    }

                    fetch("/profile", {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                    })
                    .then(res => {
                    if (!res.ok) throw new Error("Token 無效或過期");
                    return res.text();
                    })
                    .then(html => {
                    document.body.innerHTML = html; // 把回來的 HTML 直接渲染
                    })
                    .catch(err => {
                    alert("Token 無效或已過期，請重新登入");
                    window.location.href = "/login";
                    });
                    return false; // 阻止 a 標籤的預設跳轉行為
                }
                </script>
            </body>
            </html>
        `);
        } else {
            // 帳密不符：回傳 401 與提示頁
            res.status(401).send(`
                <html>
                <head><meta charset="utf-8"><title>登入失敗</title></head>
                <body>
                    <h2>❌ 登入失敗</h2>
                    <p>帳號或密碼錯誤，請重新輸入。</p>
                    <p><a href="/login">返回登入頁</a></p>
                </body>
                </html>
            `);
        }
    });
});

// 註冊表單處理：驗證 + 寫入 members.json
app.post('/register', [
    check('username')                               // 驗證 username 欄位
        .trim()
        .notEmpty().withMessage('帳號為必填')
        .isLength({ min: 3 }).withMessage('帳號至少 3 個字元'),
    check('password')                               // 驗證 password 欄位
        .notEmpty().withMessage('密碼為必填')
        .isLength({ min: 4 }).withMessage('密碼至少 4 個字元')
], (req, res) => {
    const errors = validationResult(req);           // 收集驗證結果
    if (!errors.isEmpty()) {                        // 有錯誤則回傳 400 與錯誤訊息
        return res.status(400).send(`
            <h2>❌ 註冊失敗</h2>
            <ul>${errors.array().map(e => `<li>${e.msg}</li>`).join('')}</ul>
            <p><a href="/sign_up2.html">返回註冊頁</a></p>
        `);
    }

    const { username, password } = req.body;                // 取得表單輸入
    const filePath = path.join(__dirname, 'members.json');  // 會員檔案位置

    fs.readFile(filePath, 'utf8', (err, data) => {          // 讀取現有會員資料
        if (err) return res.status(500).send('讀取會員資料時發生錯誤');

        let members;
        try {
            members = JSON.parse(data);                     // 解析 JSON
        } catch {
            return res.status(500).send('會員資料格式錯誤');
        }

        const exists = Object.values(members).some(         // 檢查帳號是否已存在
            m => m.username === username
        );
        if (exists) {                                       // 已存在則回傳提示頁
            return res.send(`
                <html>
                <head><meta charset="utf-8"><title>註冊失敗</title></head>
                <body>
                    <h2>❌ 註冊失敗</h2>
                    <p>帳號已被使用，請選擇其他帳號。</p>
                    <p><a href="/sign_up2.html">返回註冊頁</a></p>
                </body>
                </html>
            `);
        }

        const maxId = Math.max(                                      // 找出目前最大 ID 數字
            ...Object.values(members)
                .map(m => parseInt(m.id.replace('M', ''), 10))
        );
        const newId = `M${String(maxId + 1).padStart(4, '0')}`;     // 產生新 ID（補零）
        const newKey = `member${Object.keys(members).length + 1}`;  // 新的成員 key
        members[newKey] = { username, password, id: newId };        // 加入新會員

        fs.writeFile(                                               // 寫回 members.json（美化縮排）
            filePath,
            JSON.stringify(members, null, 4),
            'utf8',
            (writeErr) => {
                if (writeErr) return res.status(500).send('寫入會員資料時發生錯誤');

                // 註冊成功頁
                res.send(`
                    <html>
                    <head><meta charset="utf-8"><title>註冊成功</title></head>
                    <body>
                        <h2>✅ 註冊成功！</h2>
                        <p>歡迎加入，${username}！</p>
                        <p>系統已分配您的會員 ID：${newId}</p>
                        <p><a href="/">前往主頁</a></p>
                    </body>
                    </html>
                `);
            }
        );
    });
});

// JWT 驗證中介層：保護需要登入的路由
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];          // 取得 Authorization 標頭
    const token = authHeader && authHeader.split(' ')[1];     // 解析 Bearer <token>

    if (!token) {
        return res.status(401).send('未提供 Token，請先登入'); // 無 token，拒絕
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {                  // 驗證 token 有效性與簽名
        if (err) return res.status(403).send('Token 無效或已過期');  // 驗證失敗
        req.user = user;                                            // 將 payload 放到 req.user
        next();                                                     // 繼續進入下一個處理器
    });
}

// 受保護頁面：必須通過 JWT 驗證
app.get('/profile', authenticateToken, (req, res) => {
    res.send(`
        <html>
        <head><meta charset="utf-8"><title>會員中心</title></head>
        <body>
            <h2>👤 會員中心</h2>
            <p>歡迎，${req.user.username} (ID: ${req.user.id})</p>
            <p><a href="/logout">登出</a></p>
        </body>
        </html>
    `);
});

// 登出頁：清除前端的 JWT（因 JWT 無狀態，伺服器不需銷毀）
app.get('/logout', (req, res) => {
    res.send(`
        <html>
        <head><meta charset="utf-8"><title>已登出</title></head>
        <body>
            <h2>👋 您已成功登出</h2>
            <p>您的 Token 已被清除</p>
            <p><a href="/login">返回登入頁</a></p>

            <script>
              // 移除 localStorage 中的 jwtToken，避免後續誤用
              localStorage.removeItem("jwtToken");
            </script>
        </body>
        </html>
    `);
});

// 啟動伺服器並監聽 8080 埠
app.listen(port, () => {
    console.log(`🚀 伺服器運行於 http://localhost:${port}/login`);
});



// ************************************************************************************
/*
✅ Updated ex03d.js
🔑 主要修改點
移除了 express-session，改用 jsonwebtoken。
登入成功時回傳 JWT Token，而不是建立 session。
新增 authenticateToken 中介層，保護 /profile 頁面。
登出只需前端丟棄 token（因為 JWT 是無狀態的）。

🔑 主要修改點1：
加一個「自動檢查 localStorage 裡是否有 token，沒有就跳回登入頁」的功能。 這樣使用者如果沒有登入
或 token 遺失，就會被導回 /login，流程更完整。
改寫登入成功頁面，讓它自動把 token 存進 localStorage，之後 fetch 就能直接取用
登入成功頁面改一下，讓它自動把 JWT Token 存進 localStorage，之後前端就能直接用 fetch 取出來呼叫受保護的 API。

功能說明：
1) 登入成功後：伺服器會把 JWT Token 直接存進 localStorage。
=> localStorage.setItem("jwtToken", "${token}");
之後呼叫 API：只要從 localStorage 取出 token，加到 Authorization header。
範例 goProfile()：示範如何在點擊「會員中心」時，自動帶上 token 呼叫 /profile，並把回傳的 HTML 顯示在頁面上。
2) 頁面載入時 → 自動檢查 localStorage 是否有 token，沒有就跳回 /login。
3) 呼叫受保護 API → fetch 時自動帶上 Authorization: Bearer <token>。
4) Token 過期或無效 → 自動提示並導回登入頁。

🔑 主要修改點2：
把「登出時自動清除 localStorage 裡的 token」加上去，這樣整個登入/驗證/登出流程就完整了。

完整流程：
1) 登入成功 → 伺服器回傳 JWT，並自動存進 localStorage。
2) 訪問受保護頁面 → 前端從 localStorage 取出 token，放進 Authorization: Bearer <token> header。
3) 頁面載入時檢查 → 如果沒有 token，自動導回 /login。
4) 登出 → /logout 頁面會自動清除 localStorage 裡的 token，確保安全。

重點總結：
1) 用 jsonwebtoken 取代 session：登入後簽發 token，前端存到 localStorage。
2) 保護路由靠 middleware authenticateToken：從 Authorization header 讀取 Bearer token，驗證通過才放行。
3) 登出只清前端 token：JWT 是無狀態，伺服器不維持登入狀態。
4) 檔案 I/O 還是用 members.json 當資料來源，簡單容易測試。
5) 在 express-session 裡有 rolling: true 這種設定，可以讓伺服器在每次回應時都「刷新」cookie 的過期時間。 
但 JWT 本質上是「無狀態」的，一旦簽發，裡面的 exp（過期時間）就是固定的，沒有辦法像 session 一樣自動延長。
*/
const express = require('express');
const fs = require('fs');
const path = require('path');
const { check, validationResult } = require('express-validator');
const session = require('express-session'); // ✅ 引入 session 模組

const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    // res.redirect('/login');  // redirect to /login 
    res.sendFile(path.join(__dirname, 'public', 'sign_in.html'));
});

app.use(express.static(path.join(__dirname, 'public'))); // 設定 public 資料夾為靜態資源目錄，能直接提供 HTML、CSS、圖片等檔案給瀏覽器。例如：sign_in.html

// ✅ 設定 express-session 中介層
app.use(session({
    secret: 'your-secret-key',              // 建議改成環境變數
    resave: false,                          // 如果沒有修改 Session，不會強制儲存，提升效能。
    saveUninitialized: false,               // 只有登入後才會建立 Session，避免浪費伺服器資源。
    rolling: true,                          // reset cookie expiration on every response
    // cookie: { maxAge: 1000 * 60 * 30 }   // 限時 30 分鐘
    cookie: { maxAge: 1000 * 60 * 1 }       // 限時 1 分鐘
}));

// 登入頁面
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign_in2.html'));
});

// ✅ 登入表單處理 + 驗證中介層
app.post('/submit', [
    check('username')
        .trim()
        .notEmpty().withMessage('請輸入帳號')
        .isLength({ min: 3 }).withMessage('帳號至少 3 個字元'),
    check('password')
        .notEmpty().withMessage('請輸入密碼')
        .isLength({ min: 4 }).withMessage('密碼至少 4 個字元')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(`
            <h2>❌ 登入失敗</h2>
            <ul>${errors.array().map(e => `<li>${e.msg}</li>`).join('')}</ul>
            <p><a href="/login">返回登入頁</a></p>
        `);
    }

    const { username, password } = req.body;
    const filePath = path.join(__dirname, 'members.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('讀取會員資料時發生錯誤');

        let members;
        try {
            members = JSON.parse(data);
        } catch {
            return res.status(500).send('會員資料格式錯誤');
        }

        const matched = Object.values(members).find(
            m => m.username === username && m.password === password
        );

        if (matched) {
            // ✅ 設定 session
            req.session.user = { id: matched.id, username: matched.username };

            res.send(`
                <html>
                <head><meta charset="utf-8"><title>登入成功</title></head>
                <body>
                    <h2>✅ 歡迎回來，${matched.username}！</h2>
                    <p>您的會員 ID 是：${matched.id}</p>
                    <p><a href="/">返回主頁</a></p>
                    <p><a href="/logout">登出</a></p>
                </body>
                </html>
            `);
        } else {
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

// ✅ 註冊表單處理 + 驗證中介層
app.post('/register', [
    check('username')
        .trim()
        .notEmpty().withMessage('帳號為必填')
        .isLength({ min: 3 }).withMessage('帳號至少 3 個字元'),
    check('password')
        .notEmpty().withMessage('密碼為必填')
        .isLength({ min: 4 }).withMessage('密碼至少 4 個字元')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(`
            <h2>❌ 註冊失敗</h2>
            <ul>${errors.array().map(e => `<li>${e.msg}</li>`).join('')}</ul>
            <p><a href="/sign_up2.html">返回註冊頁</a></p>
        `);
    }

    const { username, password } = req.body;
    const filePath = path.join(__dirname, 'members.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('讀取會員資料時發生錯誤');

        let members;
        try {
            members = JSON.parse(data);
        } catch {
            return res.status(500).send('會員資料格式錯誤');
        }

        const exists = Object.values(members).some(m => m.username === username);
        if (exists) {
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

        const maxId = Math.max(
            ...Object.values(members)
                .map(m => parseInt(m.id.replace('M', ''), 10))
        );
        const newId = `M${String(maxId + 1).padStart(4, '0')}`;
        const newKey = `member${Object.keys(members).length + 1}`;
        members[newKey] = { username, password, id: newId };

        fs.writeFile(filePath, JSON.stringify(members, null, 4), 'utf8', (writeErr) => {
            if (writeErr) return res.status(500).send('寫入會員資料時發生錯誤');

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
        });
    });
});

// ✅ 登出路由
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.send(`
            <html>
            <head><meta charset="utf-8"><title>已登出</title></head>
            <body>
                <h2>👋 您已成功登出</h2>
                <p><a href="/login">返回登入頁</a></p>
            </body>
            </html>
        `);
    });
});

// ✅ 範例受保護頁面
app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.send(`
        <html>
        <head><meta charset="utf-8"><title>會員中心</title></head>
        <body>
            <h2>👤 會員中心</h2>
            <p>歡迎，${req.session.user.username} (ID: ${req.session.user.id})</p>
            <p><a href="/logout">登出</a></p>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`🚀 伺服器運行於 http://localhost:${port}`);
});



// ************************************************************************************
/**
✅ Updated ex03c.js (Server-side Validation thru express-validator)

🔑 新增的功能
express-session 中介層，管理登入狀態。
成功登入後，將使用者資訊存入 req.session.user。
新增 /logout 路由，清除 session。
新增 /profile 範例受保護頁面，只有登入後才能進入。
這樣就能在登入後維持使用者狀態，並在需要的頁面檢查 session 來保護資源。

⚠️ Important nuance:
By default, the session cookie’s timer does not reset automatically on every request. If you want the 1‑minute 
window to “slide” forward each time the user interacts, you can enable rolling sessions:
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    rolling: true, // ✅ reset cookie expiration on every response
    cookie: { maxAge: 1000 * 60 * 30 }
}));

With rolling: true, every request (including an F5 refresh) will push the expiry 30 minutes further into the 
future, so the session stays alive as long as the user is active.

 */

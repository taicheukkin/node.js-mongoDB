const express = require('express'); // 載入 Express 模組，用來建立 Web 伺服器與處理 HTTP 路由
const fs = require('fs');           // 載入 Node.js 的檔案系統模組，用來讀取與寫入本地 JSON 檔案
const path = require('path');       // 載入 Node.js 的路徑模組，協助處理跨平台的檔案路徑拼接
const { check, validationResult } = require('express-validator'); // ✅ 引入驗證模組

// 建立 Express 應用實例，並設定伺服器監聽的埠號為 8080
const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    // res.redirect('/login');  // redirect to /login 
    res.sendFile(path.join(__dirname, 'public', 'sign_in2.html'));
});

app.use(express.static(path.join(__dirname, 'public'))); // 設定 public 資料夾為靜態資源目錄，能直接提供 HTML、CSS、圖片等檔案給瀏覽器。例如：sign_in.html

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
            res.send(`
                <html>
                <head><meta charset="utf-8"><title>登入成功</title></head>
                <body>
                    <h2>✅ 歡迎回來，${matched.username}！</h2>
                    <p>您的會員 ID 是：${matched.id}</p>
                    <p><a href="/">返回主頁</a></p>
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

app.listen(port, () => {
    console.log(`🚀 伺服器運行於 http://localhost:${port}`);
});


// ************************************************************************************
/**
✅ Updated ex03a.js (Server-side Validation thru express-validator)
使用 express-validator，加入 check 和 validationResult 中介層來處理輸入驗證：

Highlights: (sign-in & sign-up features)
1: Serve sign_in.html as the login page thru 
http://localhost:8080/login
or 
rename sign_in.html to index.html, then link to
http://localhost:8080

both have the same result.

2: Read members.json
3: Check if the username already exists
4: If it does, respond with a message prompting retry
5: If it’s available, add the new member and confirm success
 */

const express = require('express'); // 載入 Express 模組，用來建立 Web 伺服器與處理 HTTP 路由
const fs = require('fs');           // 載入 Node.js 的檔案系統模組，用來讀取與寫入本地 JSON 檔案
const path = require('path');       // 載入 Node.js 的路徑模組，協助處理跨平台的檔案路徑拼接

// 建立 Express 應用實例，並設定伺服器監聽的埠號為 8080
const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: true }));         // 啟用 urlencoded 中介軟體，讓 Express 解析來自 HTML 表單的 POST 資料

app.get('/', (req, res) => {
    // res.redirect('/login');  // redirect to /login 
    res.sendFile(path.join(__dirname, 'public', 'sign_in.html'));
});

app.use(express.static(path.join(__dirname, 'public'))); // 設定 public 資料夾為靜態資源目錄，能直接提供 HTML、CSS、圖片等檔案給瀏覽器。例如：sign_in.html

// 登入頁面路由：當使用者造訪 /login，伺服器會回傳 sign_in.html 登入頁面
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign_in.html'));
});

// 登入表單處理：當使用者提交登入表單至 /submit，伺服器會從表單中取得 username 和 password
app.post('/submit', (req, res) => {
    const { username, password } = req.body;

    // 基本驗證：若任何一欄位為空，回傳 400 錯誤並提示使用者
    if (!username || !password) {
        return res.status(400).send('請輸入帳號與密碼');
    }

    // 設定會員資料的 JSON 檔案路徑
    const filePath = path.join(__dirname, 'members.json');

    // 非同步讀取 members.json 檔案內容
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('讀取會員資料時發生錯誤');

        // 嘗試解析 JSON 資料，若格式錯誤則回傳 500
        let members;
        try {
            members = JSON.parse(data);
        } catch {
            return res.status(500).send('會員資料格式錯誤');
        }

        // 檢查是否有符合的帳號與密碼
        const matched = Object.values(members).find(
            m => m.username === username && m.password === password
        );

        // 若登入成功，顯示歡迎訊息與會員 ID；若失敗，提示錯誤並提供返回登入頁的連結
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

// 啟動 Express 伺服器並監聽指定埠號，成功後在終端機顯示運行訊息
app.listen(port, () => {
    console.log(`🚀 伺服器運行於 http://localhost:${port}`);
});


// ************************************************************************************
/**
index_post_useExpress3.js = Ex03.js

Highlights:
1: Serve sign_in.html as the login page thru 
http://localhost:8080/login
or 
rename sign_in.html to index.html, then link to
http://localhost:8080

both have the same result.

2: Handle POST requests to /submit to validate credentials.
3: Read and verify against members.json.
4: Provide appropriate feedback (success or failure).
 */

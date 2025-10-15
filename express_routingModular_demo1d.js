const express = require('express');
const session = require('express-session');
const app = express();

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin3');

// 使用 session 中介層
app.use(session({
  secret: 'my-secret-key',            // 建議改成更安全的隨機字串
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 30 }  // 30 分鐘有效
}));

// 解析 POST 表單資料
app.use(express.urlencoded({ extended: true }));

// 主頁路由
app.get('/', (req, res) => {
  res.redirect('/login');

});

// 模擬登入頁
app.get('/login', (req, res) => {
  res.send(`
    <h1>🔑 Login</h1>
    <form method="POST" action="/login">
      <input type="text" name="username" placeholder="Username" required /><br/><br/>
      <input type="password" name="password" placeholder="Password" required /><br/><br/>
      <button type="submit">Login</button>
    </form>
  `);
});

// 處理登入
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 簡單模擬驗證（實務上應該查資料庫）
  if (username === 'admin' && password === '1234') {
    req.session.user = { name: username }; // 在 session 中存放使用者資訊
    res.redirect('/admin3');
  } else {
    res.send('<h1>❌ 登入失敗</h1><a href="/login">再試一次</a>');
  }
});

// 登出
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid'); // 清除 session cookie
    res.send('<h1>👋 已登出</h1><a href="/login">重新登入</a>');
  });
});

// 掛載路由模組
app.use('/api', apiRoutes);
app.use('/admin3', adminRoutes);

app.listen(8080, () => {
  console.log("🚀 伺服器已啟動：http://127.0.0.1:8080/");
});


// ************************************************************************************
/*
多模組化路由 (/routes/admin3.js) - 掛載 多個路由模組，這樣可以讓不同功能的路由分工更清楚。
一組是 /api，
一組是 /admin3 (需要驗證)。
把剛才的 Admin 路由驗證，使用 query string 模擬登入驗證， 改成使用 Cookie / Session，這樣就更
接近真實的登入流程了。 在主程式中引入 express-session，並設定 session middleware。 

✅ 使用流程
使用者先進入 http://127.0.0.1:8080/login → 輸入帳號密碼（admin / 1234）。
登入成功後，伺服器會在 session 中存放使用者資訊，並發送一個 session cookie (connect.sid) 給瀏覽器。
之後訪問 /admin/... 路由時，會自動帶上 cookie，後台驗證通過即可進入。
點擊 /logout 會清除 session 與 cookie，必須重新登入才能再進入 /admin。
*/
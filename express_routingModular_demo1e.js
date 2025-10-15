const express = require('express');
const session = require('express-session');
const app = express();

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin4');

app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 30 } // 30 分鐘
}));

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

  // 模擬帳號資料
  if (username === 'admin' && password === '1234') {
    req.session.user = { name: username, role: 'admin' };
    res.redirect('/admin4');
  } else if (username === 'bob' && password === '5678') {
    req.session.user = { name: username, role: 'user' };
    res.redirect('/admin4');
  } else {
    res.send('<h1>❌ 登入失敗</h1><a href="/login">再試一次</a>');
  }
});

// 登出
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.send('<h1>👋 已登出</h1><a href="/login">重新登入</a>');
  });
});

// 掛載路由
app.use('/api', apiRoutes);
app.use('/admin4', adminRoutes);

app.listen(8080, () => {
  console.log("🚀 伺服器已啟動：http://127.0.0.1:8080/");
});


// ************************************************************************************
/*
多模組化路由 (/routes/admin4.js) - 掛載 多個路由模組，這樣可以讓不同功能的路由分工更清楚。
一組是 /api，
一組是 /admin4 (需要驗證)。
把剛才的 Admin 路由驗證，使用 query string 模擬登入驗證， 改成使用 Cookie / Session，這樣就更
接近真實的登入流程了。 在主程式中引入 express-session，並設定 session middleware。 
在 Session 登入驗證 的基礎上，加入 角色權限控制（例如 admin 與 user），讓不同角色能看到不同的後台頁面或功能。

✅ 使用流程
登入 http://127.0.0.1:8080/login
帳號 admin / 密碼 1234 → 角色 admin
帳號 bob / 密碼 5678 → 角色 user

登入後進入 /admin4 首頁，會顯示使用者名稱與角色。
user 角色只能看到首頁，若嘗試進入 /admin/users 或 /admin/settings 會被拒絕。
admin 角色則能進入所有頁面。
*/
// 引入 Express 框架
const express = require('express');     
// 引入 Handlebars 模板引擎：用來渲染 Handlebars 模板（HTML + 動態數據）          
const { engine } = require('express-handlebars'); 

const app = express();  // 建立 Express 應用，管理 請求與回應

// 設定 Handlebars 作為 Express 的模板引擎，副檔名使用 .hbs；指定 defaultLayout: false
//（不使用預設佈局），這樣 Express 會直接渲染 home.hbs，不需要 main.hbs 佈局
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: false })); 
app.set('view engine', 'hbs');  // 告訴 Express 預設渲染引擎為 Handlebars

// 處理 / 路由：當客戶端訪問 /（首頁）時，Express 會渲染 views/home.hbs 模板。
app.get('/', (req, res) => {
  // 渲染 home.hbs，並傳入動態數據
  res.render('home', { title: "Handlebars", message: "這是 Express + Handlebars 的示例" });
});

app.listen(3000, () => console.log('🚀 伺服器運行於 http://localhost:3000'));


// ************************************************************************************
/*
方法 1：建立 main.hbs 佈局模板
1️⃣ 在你的專案目錄 node-project-01/views/layouts/ 內建立 main.hbs 
2️⃣ 新增以下基本結構

方法 2：指定 defaultLayout: false（不使用預設佈局）
📌 修改 app.js 設定 Handlebars
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: false }));
app.engine('hbs', engine({ extname: '.hbs' }));
📌 這樣 Express 會直接渲染 home.hbs，不需要 main.hbs 佈局。
*/
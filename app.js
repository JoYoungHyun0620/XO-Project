const express = require("express"); // express불러오기
const app = express(); // 서버생성 완료

const DB_router = require("./routes/DB_router")
const session = require("express-session");
const MysqlStore = require("express-mysql-session");
const bodyparser = require("body-parser")

app.use(express.static("./public")); // 현재 express에서 정적파일 폴더 지정

// express가 응답을 쉽게 할 수 있게 가지고있는 view engine을 ejs형식으로 설정nod
app.set("view engine", "ejs");

let DB_info = {
    host: 'localhost',
    user: 'root',
    password: 'Rkgus1~!@#',
    port: 3306,
    database: 'foodline'
};

let sessionstore = new MysqlStore(DB_info);

app.use(session({
    secret: 'smart', // 세션에 대한 암호키 설정
    resave: false, // 서버를 사용할 때마다 무조건 세션값을 저장할 건지
    saveUninitialized: true, //세션을 저장할때마다 초기값으로 만들어줄건지
    store: sessionstore
}));

app.use(bodyparser.urlencoded({ extended: false }));
// 미들웨어 등록
app.use(DB_router);

app.listen(5000, function () {
    console.log("5000번 포트 서버실행")
})
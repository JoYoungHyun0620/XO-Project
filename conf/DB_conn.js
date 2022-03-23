const mysql_conn = require('mysql');


// mysql에 접근하려는 정보가 정확했을 떄,
// node.js 에서 Mysql을 핸들링할 수 있는 conn객체 리턴

let conn = mysql_conn.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Rkgus1~!@#',
    port: 3306,
    database: 'foodline'
});

conn.connect();
console.log('PROJECT DB 연결 성공');

//mysql과 연결에 성공한 값을 찾고 있는 conn을 모듈화
module.exports = conn;
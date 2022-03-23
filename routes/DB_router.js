const express = require('express');
const router = express.Router();
// mysql 모듈 불러오기
const conn = require("../conf/DB_conn.js");
const fs = require('fs');
const multiparty = require('multiparty');
const { PythonShell } = require('python-shell');
const { result } = require('underscore');


// 회원가입
router.get('/Join', function (request, response) {

    let data = request.query.data;

    sql = `insert into member values (?,?,?,?)`
    conn.query(sql, [data.uid, data.pw, data.uname, data.cp], function (err, rows) {
        if (!err) {
            console.log("회원가입성공");
            response.send({ data: data })
        } else {
            console.log(err)
            location.reload();
        }
    })
});

// 로그인 라우터 구현
router.post('/DBLogin', function (request, response) {

    let sql = "select * from member where MEMBER_ID = ?";
    let user_id = request.body.id;
    let user_pw = request.body.pw;

    console.log(user_id);
    console.log(user_pw)


    // sql 문의 ?자리에 값이 들어가도록 문장옆에 대괄호를 써서 입력
    conn.query(sql, [user_id], function (err, rows) {

        if (rows[0]) {
            //DB에서 검색된 데이터가 있을 때에만 로그인 기능 실행
            if (user_pw == rows[0].MEMBER_PW) {
                console.log('패스워드 일치')
                request.session.user = {
                    id: rows[0].MEMBER_ID,
                    nick: rows[0].MEMBER_NICK,
                };
                // render는 맨나중에써줘야해..
                response.render('index', {
                    user: request.session.user
                })
            } else {
                response.setHeader('Content-Type', 'text/html; charset=utf-8');
                response.write('<script>alert("아이디 또는 비밀번호가 올바르지 않습니다"); location.href="http://localhost:5000/Main"</script>');
                // alert('아이디 또는 비밀번호가 일치하지 않습니다');
                console.log('로그인실패' + err);
            }
        } else {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.write('<script>alert("아이디 또는 비밀번호가 올바르지 않습니다"); location.href="http://localhost:5000/Main"</script>');
            console.log('검색실패' + err);
        }
    })
});

// 로그아웃 라우터 구현
router.get('/Logout', function (request, response) {

    delete request.session.user;

    response.render("index", {
        user: request.session.user
    });

});

//아이디 중복 검사
router.get('/OneSelect', function (request, response) {

    let ID = request.query.ID;
    let sql = "select * from member where MEMBER_ID = ?";

    conn.query(sql, [ID], function (err, rows) {
        if (!err) {
            console.log("rows" + rows.length);
            response.write(rows.length + "")
            response.end()
        } else {
            console.log("검색실패" + err);
        }
    })
});


// 직접검색한 결과 가져오기
router.get('/Direct_search', function (request, response) {

    let sql = "select * from member";

    // sql 문의 ?자리에 값이 들어가도록 문장옆에 대괄호를 써서 입력
    conn.query(sql, function (err, rows) {

        if (!err) {
            response.render('index', {
                rows: rows
            })
        } else {
            console.log('검색실패' + err);
        }

    })
});



// 직접검색 결과 노출 부분
router.post('/searchButton', function (request, response) {
    let recipe_id_list = [];
    let recipe_name_list = [];
    let recipe_sumry_list = [];
    let recipe_irdnts_list = [];
    var REC_DESC_list = [];
    let data = request.body.data;
    let sql = `select S.RECIPE_ID, S.RECIPE_NM_KO, S.IRDNTS, O.REC_DESC, S.SUMRY from recipe_sumry S, recipe_order O where S.RECIPE_ID = O.REC_CODE and S.RECIPE_NM_KO like '%${data}%'`;

    conn.query(sql, function (err, rows) {
        if (!err) {
            // 디비에서 받아온 값을 리스트에추가하고 중복제거함----
            for (i = 0; i < rows.length; i++) {
                recipe_id_list.push(rows[i].RECIPE_ID)
                recipe_name_list.push(rows[i].RECIPE_NM_KO)
                recipe_sumry_list.push(rows[i].SUMRY)
                recipe_irdnts_list.push(rows[i].IRDNTS)
            }
            var uniq_id_list = recipe_id_list.reduce(function (a, b) {
                if (a.indexOf(b) < 0) a.push(b);
                return a;
            }, []);
            var uniq_name_list = recipe_name_list.reduce(function (a, b) {
                if (a.indexOf(b) < 0) a.push(b);
                return a;
            }, []);
            var uniq_sumry_list = recipe_sumry_list.reduce(function (a, b) {
                if (a.indexOf(b) < 0) a.push(b);
                return a;
            }, []);
            var uniq_irdnts_list = recipe_irdnts_list.reduce(function (a, b) {
                if (a.indexOf(b) < 0) a.push(b);
                return a;
            }, []);
            //------------------------중복제거------------------------------

            //요리순서 부분 비교한후에 여러행을 하나의 문자열로 만들어서 리스트에추가
            for (i = 0; i < 120500; i++) {
                var test_str = "";

                for (j = 0; j < rows.length; j++) {
                    if (i == rows[j].RECIPE_ID) {
                        test_str += ":"
                        test_str += rows[j].REC_DESC
                    }
                }
                if (test_str.length == 0) {
                }
                else {
                    REC_DESC_list.push(test_str)
                    console.log(i + "번호 합치기 합치기")
                }
            }
            //-----------------------요리순서-----------------------

            response.send({
                res_recipe_id: uniq_id_list, res_recipe_name: uniq_name_list,
                res_recipe_order: REC_DESC_list, res_recipe_sumry: uniq_sumry_list, res_recipe_irdnts: uniq_irdnts_list
            })
        } else {
            console.log("검색실패" + err);
        }
    })
});

// 재료 직접 추가 라우터

router.get('/save_direct', function (request, response) {
    let result = request.query.data;
    let user_id = request.session.user.id

    let sql = `insert into ingrd_in_fred (USER_ID, INGRD_NM, INGRD_CAT, INGRD_STORE, BUY_DATE) 
    values `;

    for (var i = 0; i < result.name.length; i++) {
        if (i == (result.name.length - 1)) {
            sql += `('${user_id}', '${result.name[i]}', '${result.class[i]}', '${result.storage[i]}', '${result.date[i]}') `
        } else {
            sql += `('${user_id}', '${result.name[i]}', '${result.class[i]}', '${result.storage[i]}', '${result.date[i]}'), `
        }
    }

    console.log(sql);
    conn.query(sql, function (err, rows) {
        if (!err) {
            console.log('등록완료');
            response.send({
                sql: sql
            })

        } else {
            console.log("검색실패" + err);
        }

    })


});


// 분석재료 DB 저장

router.get('/save_analyzed', function (request, response) {

    let result = request.query.data;
    let buy_date = request.query.data.date;
    let user_id = request.session.user.id;
    let sql = `insert into ingrd_in_fred (USER_ID, INGRD_NM, INGRD_CAT, INGRD_STORE, BUY_DATE) values `;
    for (var i = 0; i < result.name.length; i++) {
        if (i == (result.name.length - 1)) {
            sql += `('${user_id}', '${result.name[i]}', '${result.class[i]}', '${result.storage[i]}', '${buy_date}') `
        } else {
            sql += `('${user_id}', '${result.name[i]}', '${result.class[i]}', '${result.storage[i]}', '${buy_date}'), `
        }
    }

    console.log(sql);
    conn.query(sql, function (err, rows) {
        if (!err) {
            console.log('등록완료');
            response.send({
                length: result.name.length
            })

        } else {
            console.log("검색실패" + err);
        }

    })



});

//재료 조회 라우터
router.post('/materialSelect', function (request, response) {

    let id = request.session.user.id
    let sql = `select INGRD_ID, USER_ID, INGRD_NM, INGRD_CAT, INGRD_STORE, 
    date_format(BUY_DATE, '%Y-%m-%d') AS BUY_DATE, 
    DATE_FORMAT(DATE_ADD(BUY_DATE, INTERVAL 5 DAY), '%Y-%m-%d') AS EXP_DATE 
    from ingrd_in_fred where USER_ID = ?`

    conn.query(sql, [id], function (err, rows) {
        if (!err) {
            console.log(rows),
                response.send({ materialSelect: rows })
        } else {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.write('<script>alert("재료조회 실패"); location.href="http://localhost:5000/Main"</script>');
        }
    })
});

//재료 삭제 라우터
router.post('/materialDelete', function (request, response) {

    let data_ = request.body.data;

    let sql = "delete from ingrd_in_fred where INGRD_ID = ?";

    conn.query(sql, [data_], function (err, rows) {
        if (!err) {
            console.log("삭제성공")
        } else {
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.write('<script>alert("재료조회 실패"); location.href="http://localhost:5000/Main"</script>');
        }

    })
});

//이미지 업로드
router.post("/image_upload", function (request, response) {

    let form = new multiparty.Form({
        autoFiles: false, // 요청이들어오면 자동으로 파일을 저장할 것인가?
        uploadDir: 'upload',
        maxFilesSize: 1024 * 1024 * 5

    });

    form.parse(request, function (error, fields, files) {
        // 파일전송이 요청되면 이곳으로 옴.
        // 에러와 필드정보, 파일객체가 넘어옴
        console.log(files)
        let path = files.image_input[0].path;
        console.log(path);
        // 저장되는 파일의 이름을 업로드한 파일이름으로 변경
        fs.rename(path, 'upload\\' + files.image_input[0].originalFilename, function (err) {

        });
    });

});

// 추천하기 
router.post("/recommend", function (request, response) {
    let id = request.session.user.id;

    console.log(id)
    var options = {
        mode: 'json',
        pythonPath: 'C:\\Users\\SMT075\\anaconda3\\python.exe', // 돌릴때 user명 변경 필수
        pythonOption: ['-u'],
        scriptPath: 'python/',
        args: [id]
    }
    PythonShell.run('recommend_total.py', options, function (err, results) {
        if (err) throw err;
        let results_rec_id = Object.keys(results[0]);

        sql = `SELECT I.RECIPE_ID, I.RECIPE_NM_KO, I.SUMRY, G.IRDNTS, I.COOKING_TIME, 
        I.QNT, O.FULL_ORDER, I.IMG_URL
        FROM recipe_info I, full_order O, recipe_ingrd G
        WHERE I.RECIPE_ID = O.REC_CODE
        AND I.RECIPE_ID = G.RECIPE_ID
        AND I.RECIPE_ID IN (`

        for (var i = 0; i < results_rec_id.length; i++) {

            if (i == (results_rec_id.length - 1)) {
                sql += `${parseInt(results_rec_id[i])})`;
            } else {
                sql += `${parseInt(results_rec_id[i])},`;
            }
        };
        // sql 문 확인
        console.log(sql);
        conn.query(sql, function (err, rows) {
            if (!err) {
                // Ajax로 전달하기 위한 데이터셋 만들기
                let recipe_id = [];
                let recipe_nm_ko = [];
                let sumry = [];
                let cook_time = [];
                let qnt = [];
                let order_list = []
                let img_url = []
                let must_buy_list = []
                let ingrd_list = []
                for (var i = 0; i < rows.length; i++) {
                    recipe_id.push(rows[i].RECIPE_ID);
                    recipe_nm_ko.push(rows[i].RECIPE_NM_KO);
                    sumry.push(rows[i].SUMRY);
                    cook_time.push(rows[i].COOKING_TIME);
                    qnt.push(rows[i].QNT);
                    order_list.push(rows[i].FULL_ORDER.split('/'));
                    img_url.push(rows[i].IMG_URL);
                    must_buy_list.push(results[0][results_rec_id[i]]);
                    ingrd_list.push(rows[i].IRDNTS)
                }
                response.send({
                    "REC_ID": recipe_id, "REC_NM_KO": recipe_nm_ko, "SUMRY": sumry,
                    "IRDNTS": ingrd_list, "COOK_TIME": cook_time, "QNT": qnt, "COOK_ORDER": order_list,
                    "IMG_URL": img_url, "BUY_LIST": must_buy_list
                });
            } else {
                console.log("검색실패" + err);
            };
        });
    });
});

// 영양기반 추천
router.post("/recommend_health", function (request, response) {
    let id = request.session.user.id;

    console.log(id)
    var options = {
        mode: 'json',
        pythonPath: 'C:\\Users\\SMT075\\anaconda3\\python.exe', // 돌릴때 user명 변경 필수
        pythonOption: ['-u'],
        scriptPath: 'python/',
        args: [id],
        encoding: 'utf8'
    }
    PythonShell.run('recommend_health.py', options, function (err, results) {
        if (err) throw err;
        // let results_rec_id = Object.keys(results[0]);
        console.log(results)
        console.log(results[0]['1'])
        console.log(results[0]['2'])
        console.log(results[0]['3'])

        let rec_id = results[0]['1']
        let buy_list = results[0]['2']
        let high_food_list = results[0]['3']

        sql = `SELECT I.RECIPE_ID, I.RECIPE_NM_KO, I.SUMRY, G.IRDNTS, I.COOKING_TIME, 
        I.QNT, O.FULL_ORDER, I.IMG_URL
        FROM recipe_info I, full_order O, recipe_ingrd G
        WHERE I.RECIPE_ID = O.REC_CODE
        AND I.RECIPE_ID = G.RECIPE_ID
        AND I.RECIPE_ID IN (`

        for (var i = 0; i < rec_id.length; i++) {

            if (i == (rec_id.length - 1)) {
                sql += `${rec_id[i]})`;
            } else {
                sql += `${rec_id[i]},`;
            }
        };
        // sql 문 확인
        console.log(sql);
        conn.query(sql, function (err, rows) {
            if (!err) {
                // Ajax로 전달하기 위한 데이터셋 만들기
                let recipe_id = [];
                let recipe_nm_ko = [];
                let sumry = [];
                let cook_time = [];
                let qnt = [];
                let order_list = []
                let img_url = []
                let must_buy_list = []
                let ingrd_list = []
                for (var i = 0; i < rows.length; i++) {
                    recipe_id.push(rows[i].RECIPE_ID);
                    recipe_nm_ko.push(rows[i].RECIPE_NM_KO);
                    sumry.push(rows[i].SUMRY);
                    cook_time.push(rows[i].COOKING_TIME);
                    qnt.push(rows[i].QNT);
                    order_list.push(rows[i].FULL_ORDER.split('/'));
                    img_url.push(rows[i].IMG_URL);
                    must_buy_list.push(buy_list[i]);
                    ingrd_list.push(rows[i].IRDNTS)
                }
                console.log(must_buy_list)
                response.send({
                    "REC_ID": recipe_id, "REC_NM_KO": recipe_nm_ko, "SUMRY": sumry,
                    "IRDNTS": ingrd_list, "COOK_TIME": cook_time, "QNT": qnt, "COOK_ORDER": order_list,
                    "IMG_URL": img_url, "BUY_LIST": must_buy_list, "HIGH_FOOD": high_food_list
                });
            } else {
                console.log("검색실패" + err);
            };
        });
    });
});
// 추천레시피에 별점 저장하기
router.get("/recipe_rating_save", function (request, response) {
    data = request.query.data;
    console.log(data.recipe_id);
    console.log(data);
    REC_ID = data.recipe_id;
    RATING_VALUE = data.rating_val;
    userID = request.session.user.id;

    sql = "insert into ratings values (?,?,?)"
    console.log(sql)
    conn.query(sql, [userID, REC_ID, RATING_VALUE], function (err, rows) {
        if (!err) {
            response.send({ "a": REC_ID })
        } else {
            console.log("검색실패" + err);
        }

    })
});

// 회원가입시 별점 저장용 레시피 목록 보여주기
router.get("/signup_rating", function (request, response) {

    sql = `SELECT RECIPE_ID, RECIPE_NM_KO, IMG_URL 
    from recipe_info order by rand() limit 10;`

    conn.query(sql, function (err, rows) {
        if (!err) {
            console.log(rows)
            recipe_id = [];
            recipe_nko = [];
            img_url = [];
            for (var i = 0; i < rows.length; i++) {
                recipe_id.push(rows[i].RECIPE_ID);
                recipe_nko.push(rows[i].RECIPE_NM_KO);
                img_url.push(rows[i].IMG_URL)
            }
            response.send({ "RID": recipe_id, "RNM": recipe_nko, "IMGURL": img_url })
        } else {
            console.log("검색실패")
        }

    })

})

// 회원가입시 별점 등록한것 저장하기
router.get("/new_mem_rating_save", function (request, response) {

    data = request.query.data;
    sql = `insert into ratings values `

    for (var i = 0; i < data.rid.length; i++) {
        if (i == (data.rid.length - 1)) {
            sql += `('${data.uid}', '${data.rid[i]}', '${data.rating[i]}') `
        } else {
            sql += `('${data.uid}', '${data.rid[i]}', '${data.rating[i]}'), `
        }
    }

    conn.query(sql, function (err, rows) {
        if (!err) {
            response.send({ "sql": sql })
        } else {
            console.log("검색실패")
        }
    })
})

router.post("/ocr", function (request, response) {

    let options = {
        mode: 'text',
        pythonPath: 'C:\\Users\\SMT075\\anaconda3\\python.exe',
        pythonOption: ['-u'],
        scriptPath: 'python/',
        args: [" "]
    }

    PythonShell.run('ytmtocr.py', options, function (err, results) {
        if (err) {
            throw err
        }

        response.send({
            data: results
        })
    })
})

//메인화면
router.get("/Main", function (request, response) {
    response.render("main", {
        user: request.session.user
    });
})




module.exports = router;

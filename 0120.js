const { response } = require('express')
const express = require('express')
var app = express()
var template = require('./lib/template.js');
var fs = require('fs');
const { flush } = require('pm2');
var bodyParser = require('body-parser');
var compression = require('compression');
var topicRouter = require('./routes/topic.js');
var indexRouter = require('./routes/home.js');

//미들웨어 : app.use(함수1, 함수2..) 각각의 함수 안에는 next()가 있음
//없으면 호출 끝. 인자가 없으면 함수2 실행, 인자가 있으면 다음 app.use 실행
app.use(compression());
app.use(bodyParser.urlencoded({extended:false}));
app.get('*',function(request,response,next){
   fs.readdir('./data',function(err,filelist){
       request.list = filelist;
       next();
   }) 
});
//정적인 파일 서비스 : 폴더 직접 지정. 그 밑에 있는 폴더 url로 접근 가능
//public 폴더 내에서 정적인 파일을 찾겠다
app.use(express.static('public'));

app.use('/',indexRouter);


// /topic으로 시작하는 주소들에게 topicRoute 이라는 미들웨어를 적용한다
// 미들웨어 안에는 /topic 담을 필요 없음
app.use('/topic',topicRouter);



//미들웨어는 순차적으로 실행. 맨 마지막에 404 메세지 출력
app.use((req,res,nxt)=>{
    res.status(404).send('Sorry');
})
//에러 핸들링 : 인자 4개. err인자 추가
app.use((err,req,res,next)=>{
    res.status(500).send('error!');
})
app.listen(3000,()=>console.log('example'))
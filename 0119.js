const { response } = require('express')
const express = require('express')
var app = express()
var template = require('./lib/template.js');
var fs = require('fs');
var qs = require('qs');
var path = require('path');
var sanitizedHTML = require('sanitize-html');
const { flush } = require('pm2');

app.get('/',(req,res)=> {
    fs.readdir('./data',(err,filelist)=>{
        var title = 'Welcome';
        var description = 'hello node.js~';
        var list = template.list(filelist);
        var html = template.HTML(title,list,
            `<h2>${title}</h2>${description}`,
            '<a href="/create">create</a>');
        res.send(html);
    });
});
//라우팅 기법 - url path를 통해 parameter 전달, 앞에 콜론 : 붙임

app.get('/page/:pageId',(req,res)=>{
    fs.readdir('./data',(err,filelist)=>{
        var filteredId = path.parse(req.params.pageId).base;
        fs.readFile(`data/${filteredId}`,'utf8',(error,des)=>{
            var title = req.params.pageId;
            var sanitizedTitle = sanitizedHTML(title);
            var sanitizeDescription = sanitizedHTML(des,{
                allowedTag:['h1']
            });
            var list = template.list(filelist);
            var html= template.HTML(sanitizedTitle,list,
                `<h2>${sanitizedTitle}</h2>${sanitizeDescription}`,
                `<a href = "/create"> create</a> 
                <a href = "/update/${sanitizedTitle}">update</a>
                <form action="/delete_process" method="post">
                    <input type="hidden" name="id" value="${sanitizedTitle}">
                    <input type="submit" value="delete">
                </form>
                `
            );
            res.send(html);
        });
    });
});

app.get('/create',(req,res)=>{
    fs.readdir('./data',(err,filelist)=>{
        var title = 'CREATE!';
        var list = template.list(filelist);
        var html = template.HTML(title,list,`
            <form action="/create_process" method="post">
                <p><input type = "text" name = "title" placeholder="title"></p>
                <p>
                    <textarea name="description" placeholder = "제출을 누르면 /create_process로 보냄"></textarea>
                </p>
                <p><input type = "submit"></p>
            </form>
        `, '');
        res.send(html);
    });
});
//create에서 post방식으로 전달한 데이터를 받는 법
app.post('/create_process',(request,res)=>{
    var body='';
    request.on('data',function(data){
        body = body + data;
    });
    request.on('end',function(){
        //form 태그 안에 있는 input 들 내용이 보내짐
        var post = qs.parse(body); //querystring으로 데이터가 들어오는 듯
        var title = post.title; //name이 title인 input의 내용
        var description = post.description; //name이 description인 input의 내용
        
        //파일 생성 : 제목-title, 내용-description 후 리다이렉션 시킴
        fs.writeFile(`data/${title}`, description, 'utf8', (err)=>{
            res.writeHead(302, {Location : `/?id=${title}`});
            res.end();
        });
    });
})
app.get('/update/:pageId',(request,response)=>{
    fs.readdir('./data',(err,filelist)=>{
        fs.readFile(`data/${request.params.pageId}`,'utf8',(err,description)=>{
         var title = request.params.pageId;
         var list = template.list(filelist);
         var html = template.HTML(title,list,
             `
             <form action="/update_process" method="post">
                 <input type="hidden" name="id" value="${title}">
                 <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                 <p>
                 <textarea name="description" placeholder="description">${description}</textarea>
                 </p>
                 <p>
                     <input type="submit">
                 </p>
              </form>
             `,
             `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
             );
         
         response.send(html);
        }); 
     });
})
app.post('/update_process',(request,response)=>{
    var body='';
    request.on('data',(data)=>{ body += data;});
    request.on('end',()=>{
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description;
        //파일 이름 수정
        fs.rename(`data/${id}`,`data/${title}`,(err)=>{
            //파일 내용 다시 쓴 후 리다이렉션
            fs.writeFile(`data/${title}`,description,'utf8',(error)=>{
                response.writeHead(302, {Location: `/?id=${title}`});
                response.end();
            });
        });
    });
});
app.post('/delete_process',(request,response)=>{
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        //var filteredId = path.parse(id).base;
        //파일 삭제 후 홈으로 리다이렉션
        fs.unlink(`data/${id}`, function(error){
          response.redirect('/');
        });
    });
});
app.listen(3000,()=>console.log('example'))
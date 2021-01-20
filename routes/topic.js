var express = require('express');
var router = express.Router(); //router 리턴
var sanitizedHTML = require('sanitize-html');
var fs = require('fs');
var template = require('../lib/template.js');
var path = require('path');


router.get('/create',(req,res)=>{
    
    var title = 'CREATE!';
    var list = template.list(req.list);
    var html = template.HTML(title,list,`
        <form action="/topic/create_process" method="post">
            <p><input type = "text" name = "title" placeholder="title"></p>
            <p>
                <textarea name="description" placeholder = "제출을 누르면 /create_process로 보냄"></textarea>
            </p>
            <p><input type = "submit"></p>
        </form>
    `, '');
    res.send(html);

});
//create에서 post방식으로 전달한 데이터를 받는 법
router.post('/create_process',(request,res)=>{    
//미들웨어 : body-parser 사용. request에 body속성을 만들어 줌
var post = request.body; 
var title = post.title; 
var description = post.description; 

//파일 생성 : 제목-title, 내용-description 후 리다이렉션 시킴
fs.writeFile(`data/${title}`, description, 'utf8', (err)=>{
    res.writeHead(302, {Location : `/topic/page/${title}`});
    res.end();
});
})


//라우팅 기법 - url path를 통해 parameter 전달, 앞에 콜론 : 붙임
router.get('/update/:pageId',(request,response)=>{
fs.readdir('./data',(err,filelist)=>{
    fs.readFile(`data/${request.params.pageId}`,'utf8',(err,description)=>{
     var title = request.params.pageId;
     var list = template.list(filelist);
     var html = template.HTML(title,list,
         `
         <form action="/topic/update_process" method="post">
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
         `<a href="/topic/create">create</a> <a href="/topic/update/${title}">update</a>`
         );
     
     response.send(html);
    }); 
 });
})
router.post('/update_process',(request,response)=>{
var post = request.body;
var id = post.id;
var title = post.title;
var description = post.description;
//파일 이름 수정
fs.rename(`data/${id}`,`data/${title}`,(err)=>{
    //파일 내용 다시 쓴 후 리다이렉션
    fs.writeFile(`data/${title}`,description,'utf8',(error)=>{
        response.writeHead(302, {Location: `/topic/page/${title}`});
        response.end();
    });
});

});
router.post('/delete_process',(request,response)=>{

    var post = request.body;
    var id = post.id;
    //var filteredId = path.parse(id).base;
    //파일 삭제 후 홈으로 리다이렉션
    fs.unlink(`data/${id}`, function(error){
      response.redirect('/');
    });

});
router.get('/page/:pageId',(req,res,next)=>{
    fs.readdir('./data',(err,filelist)=>{
        var filteredId = path.parse(req.params.pageId).base;
        fs.readFile(`data/${filteredId}`,'utf8',(error,des)=>{
            //페이지가 없을경우 next함수에 인자 error 전달
            if(error){next(error);}
            else{
                var title = req.params.pageId;
                var sanitizedTitle = sanitizedHTML(title);
                var sanitizeDescription = sanitizedHTML(des,{
                    allowedTag:['h1']
                });
                var list = template.list(filelist);
                var html= template.HTML(sanitizedTitle,list,
                    `<h2>${sanitizedTitle}</h2>${sanitizeDescription}`,
                    `<a href = "/topic/create"> create</a> 
                    <a href = "/topic/update/${sanitizedTitle}">update</a>
                    <form action="/topic/delete_process" method="post">
                        <input type="hidden" name="id" value="${sanitizedTitle}">
                        <input type="submit" value="delete">
                    </form>
                    `
                );
                res.send(html);
            }
            
        });
    });
});
module.exports = router;
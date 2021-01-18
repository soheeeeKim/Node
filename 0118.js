var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

function templateHTML(title, list, body, control){
    return `
    <!doctype html>
    <html>
    <head>
        <title>WEB1 - ${title}</title>
        <meta charset="utf-8">
    </head>
    <body>
        <h1><a href="/">WEB</a></h1>
        ${list}
        ${control}
        ${body}
    </body>
    </html>
    `;
}
function templateList(filelist){
    var list = '<ul>';
    for(var i = 0; i<filelist.length; i++){
        list += `<li><a href = "/?id=${filelist[i]}"> ${filelist[i]}</a></li>`;
    }
    list += '</ul>';
    return list;
}
var app = http.createServer((request,response)=>{
    var _url = request.url; //url을 가져옴
    var queryData = url.parse(_url,true).query;//쿼리 스트링
    //var title = queryData.id;//쿼리스트링의 id 값
    var pathname = url.parse(_url, true).pathname; //경로
    if(pathname === '/'){
        if(queryData.id === undefined){
            fs.readdir('./data', (err, fileList)=>{
                var title = 'HELLO!';
                var description = 'Welcome Node.js!';
                var list = templateList(fileList);
                var template = templateHTML(title, list, 
                    `<h2>${title}</h2>${description}`,
                    `<a href = "/create"> create</a>`);
                response.writeHead(200);
                response.end(template);
            });
        }
        else{
            fs.readdir('./data', function(err,filelist){
                fs.readFile(`data/${queryData.id}`, 'utf8', function(err,description){
                    var title = queryData.id;
                    var list = templateList(filelist);
                    var template = templateHTML(title,list,
                        `<h2>${title}</h2>${description}`,
                        `<a href = "/create"> create</a> 
                        <a href = "/update?id=${title}">update</a>
                        <form action="delete_process" method="post">
                            <input type="hidden" name="id" value="${title}">
                            <input type="submit" value="delete">
                        </form>
                        `
                    );
                    response.writeHead(200);
                    response.end(template);
                });
            });
        }
    }
    else if(pathname == '/create'){
        fs.readdir('./data',(err,filelist)=>{
            var title = 'CREATE!';
            var list = templateList(filelist);
            var template = templateHTML(title,list,`
                <form action="/create_process" method="post">
                    <p><input type = "text" name = "title" placeholder="title"></p>
                    <p>
                        <textarea name="description" placeholder = "제출을 누르면 /create_process로 보냄"></textarea>
                    </p>
                    <p><input type = "submit"></p>
                </form>
            `, '');
            response.writeHead(200);
            response.end(template);
        });
    }
    else if(pathname==='/create_process'){
        var body='';
        //data 받기
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
                response.writeHead(302, {Location : `/?id=${title}`});
                response.end();
            });
        });
    }
    else if(pathname=='/update'){
        fs.readdir('./data',(err,filelist)=>{
           fs.readFile(`data/${queryData.id}`,'utf8',(err,description)=>{
            var title = queryData.id;
            var list = templateList(filelist);
            var html = templateHTML(title,list,
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
            response.writeHead(200);
            response.end(html);
           }); 
        });
    }
    else if(pathname=='/update_process'){
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
    }
    else if(pathname === '/delete_process'){
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
              response.writeHead(302, {Location: `/`});
              response.end();
            });
        });
      }
    else{
        response.writeHead(404);
        response.end('Not found');
    }

});
app.listen(3000);
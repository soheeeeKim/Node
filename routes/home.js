var express = require('express');
var router = express.Router();
var template = require('../lib/template.js');

router.get('/',(req,res)=> {
    
    var title = 'Welcome';
    var description = 'hello node.js~';
    var list = template.list(req.list);
    var html = template.HTML(title,list,
        `<h2>${title}</h2>${description}
        <img src = "/images/image.png">
        `,
        '<a href="/topic/create">create</a>');
    res.send(html);
    
});

module.exports = router;
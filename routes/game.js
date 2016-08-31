var express = require('express');
var path = require('path');
var url  = require('url');
var router = express.Router();

/* GET home page. */
router.get('/*', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/game', 'index.html'));
  console.log(url.parse(req.url).path.replace("/",""));
  //res.render('index', { title: 'Express' });
  console.log(1);

});

router.post('/', function (req, res,next) {
    if(playerId > 3){
        res.send(JSON.stringify(999));
        return;
    }
    res.send(JSON.stringify(playerId));
    w.createPlayer(req.body.username, playerId);
    players.push( { id: playerId, ip: req.connection.remoteAddress.replace('::ffff:', '') } );
    playerId=playerId+1;
});

module.exports = router;

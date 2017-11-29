var config = require('config.json');
var express = require('express');
var router = express.Router();
var videoservice = require('services/video.service');

// routes
router.post('/videostatus', videoStatus);


module.exports = router;

function videoStatus(req){
    videoservice.videoUpdateStatus(req.body) 
    .then(function (response) {
        res.send(response);
    }).catch(function (err) {
        res.status(400).send(err);
    });
}


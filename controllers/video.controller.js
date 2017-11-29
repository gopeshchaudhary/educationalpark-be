var config = require('config.json');
var express = require('express');
var router = express.Router();
var videoservice = require('services/video.service');

// routes
router.post('/videostatus', videoStatus);


module.exports = router;

function videoStatus(req, res) {                                                      // username , videoid  , moduleid
    if (!req.body.username || !req.body.videoid || !req.body.moduleid) {
        res.status(200).send('{"error" : "Required params not found" }');
    }
    videoservice.videoUpdateStatus(req.body.username, req.body.videoid, req.body.moduleid)
        .then(function (response) {
            res.send(response);
        }).catch(function (err) {
        res.status(400).send(err);
    });
}


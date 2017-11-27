var config = require('config.json');
var express = require('express');
var router = express.Router();
var otpService = require('services/otpapi.service');

// routes
router.post('/generate', generate);
router.post('/verify', verify);

module.exports = router;


function generate(req, res) {
    otpService.generate(req.params._id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function verify(req, res) {
    otpService.validate(req.params._id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

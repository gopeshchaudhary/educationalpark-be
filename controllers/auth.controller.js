var config = require('config.json');
var express = require('express');
var router = express.Router();
var otpService = require('services/otpapi.service');
var profileService = require('services/profile.service');

// routes
router.post('/generate', generate);
router.post('/verify', verify);
router.post('/sendmail', sendmail);

module.exports = router;


function generate(req, res) {   // username , mobileno
    if (!req.body.username || !req.body.mobileno) {
        res.status(200).send('{"error" : "Required params not found" }');
        return false;
    }
    otpService.generate(req.body.username, req.body.mobileno)
        .then(function (response) {
            res.send(response);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function verify(req, res) {  // useraname , otp
    if (!req.body.username || !req.body.otp) {
        res.status(200).send('{"error" : "Required params not found" }');
        return false;
    }
    otpService.validate(req.body.username, req.body.otp)
        .then(function (response) {
            res.send(response);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function sendmail(req, res) {   // username , mobileno , email
    if (!req.body.username || !req.body.mobileno || !req.body.email) {
        res.status(200).send('{"error" : "Required params not found" }');
        return false;
    }
    otpService.sendmail(req.body.username, req.body.mobileno, req.body.email)
        .then(function (response) {
            profileService.initProfile(req.body.username).then(function () {
                res.send(response);
            });
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}
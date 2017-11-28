var config = require('config.json');
var express = require('express');
var router = express.Router();
var profileService = require('services/profile.service');

// routes for get profile
router.post('/get', getProfile);
router.post('/update', updateProfile);

module.exports = router;

function getProfile(req, res) {
    if(!req.body.username){
        res.status(200).send('{"error" : "Required params not found" }');
        return false;
    }
    if (req.body.username) {
        profileService.getUserProfile(req.body.username) /// user  will get exam id for the session .
            .then(function (profileData) {
                res.send(profileData);
            })
            .catch(function (err) {
                res.status(400).send(err);
            });
    } else {
        res.status(200);
    }
}

function updateProfile(req, res) {
    if(!req.body){
        res.status(200).send('{"error" : "Required params not found" }');
        return false;
    }
    profileService.updateUserProfile(req.body)
        .then(function (response) {
            res.send(response);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}
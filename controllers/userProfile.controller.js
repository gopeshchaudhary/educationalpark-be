var config = require('config.json');
var express = require('express');
var router = express.Router();
var profileService = require('services/profile.service');

// routes for get profile
router.post('/getprofile', getProfile);
router.post('/', updateProfile);

module.exports = router;

function getProfile(req, res) {
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
   
    profileService.updateUserProfile(req.body)
        .then(function () {
            console.log(res);
            console.log('success');
            res.status(200).send('Succesfully changed password');
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send(err);
        });
}
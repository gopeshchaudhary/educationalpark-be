var config = require('config.json');
var express = require('express');
var router = express.Router();
var userService = require('services/user.service');

// routes
router.post('/authenticate', authenticate);

module.exports = router;

function authenticate(req, res) {
    if(!req.body.username || !req.body.password){
        res.status(200).send('{"error" : "Required params not found" }');
        return false;
    }
    userService.authenticate(req.body.username, req.body.password, req.body.type)
        .then(function (user) {
            if (user) {
                // authentication successful
                res.send(user);
            } else {
                // authentication failed
                res.status(400).send('Username or password is incorrect');
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}
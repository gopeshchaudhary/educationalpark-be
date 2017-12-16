var config = require('config.json');
var express = require('express');
var router = express.Router();
var adminService = require('services/admin.service');
// router.post('/check', checkit);
router.post('/users', users);
router.post('/sections', sections);
router.post('/modules', modules);
router.post('/modulestatus', modulestatus);

module.exports = router;

function users(req, res) {
    if (!req.body.username) {
        res.status(200).send('{"error" : "Required Params not Found"}');
        return false;
    }
    adminService.getUsers(req.body.username).then(function (response) {
        res.send(response);
    }).catch(function (err) {
        res.status(400).send(err);
    });
}
function sections(req, res) {
    if (!req.body.username) {
        res.status(200).send('{"error" : "Required Params not Found"}');
        return false;
    }
    adminService.getSectionList(req.body.username).then(function (response) {
        res.send(response);
    }).catch(function (err) {
        res.status(400).send(err);
    });
}
function modules(req, res) {
    if (!req.body.username || !req.body.section) {
        res.status(200).send('{"error" : "Required Params not Found"}');
        return false;
    }
    adminService.getModuleList(req.body.username, req.body.section).then(function (response) {
        res.send(response);
    }).catch(function (err) {
        res.status(400).send(err);
    });
}

function modulestatus(req, res) {
    if (!req.body.username || !req.body.moduleid) {
        res.status(200).send('{"error" : "Required Params not Found"}');
        return false;
    }
    adminService.getModuleStatus(req.body.username, req.body.moduleid).then(function (response) {
        res.send(response);
    }).catch(function (err) {
        res.status(400).send(err);
    });
}
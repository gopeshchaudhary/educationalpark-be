/**
 * Created by tigerking on 22/11/17.
 */
var config = require('config.json');
var express = require('express');
var router = express.Router();
var examservice = require('services/exam.service');

// routes

router.post('/getexam', getExam);

module.exports = router;

function getExam(req, res) {
    examservice.getExamSet(req.body.moduleid)   /// user  will get exam id for the session .
        .then(function (examset) {
            res.send(examset);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}
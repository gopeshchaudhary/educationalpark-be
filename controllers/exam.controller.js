/**
 * Created by tigerking on 22/11/17.
 */
var config = require('config.json');
var express = require('express');
var router = express.Router();
var examservice = require('services/exam.service');

// routes

router.post('/getexam', getExam);
router.post('/submitexam', submitExam);

module.exports = router;

function getExam(req, res) {
    examservice.getExamSet(req.body.moduleid) /// user  will get exam id for the session .
        .then(function (examset) {
            res.send(examset);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}
// function for submit Exam and give result 
function submitExam(req, res) {
  
    examservice.submitExam(req.body) 
        .then(function (submitResult) {
            res.send(submitResult);
        }).catch(function (err) {
            res.status(400).send(err);
        });
};
var config = require('config.json');
var express = require('express');
var router = express.Router();
var examservice = require('services/exam.service');

// routes

router.post('/getexam', getExam);
router.post('/submitexam', submitExam);

module.exports = router;

function getExam(req, res) {            //  moduleid
    if (!req.body.moduleid) {
        res.status(200).send('{"error" : "Required params not found" }');
        return false;
    }
    examservice.getExamSet(req.body.moduleid)   /// user  will get exam id for the session .
        .then(function (examset) {
            res.send(examset);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

// function for submit Exam and give result 
function submitExam(req, res) {              // testData , username
    if (!req.body.testData) {
        res.status(200).send('{"error" : "Required params not found" }');
        return false;
    }
    examservice.submitExam(req.body.testData)
        .then(function (submitResult) {
            res.send(submitResult);
        }).catch(function (err) {
        res.status(400).send(err);
    });
}
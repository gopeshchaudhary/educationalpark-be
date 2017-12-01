var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var videoService = require('./video.service');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
    native_parser: true
});
db.bind('exammodules');


var examservice = {};

examservice.getExamSet = getExamSet;
examservice.submitExam = submitExam;

module.exports = examservice;
var answerKey = {
    0: 'a',
    1: 'b',
    2: 'c',
    3: 'd'
}

function getExamSet(moduleid) {
    var deferred = Q.defer();
    db.exammodules.find({
        'moduleid': moduleid
    }).toArray(function (err, module) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (module) {
            // return module (without hashed password)
            deferred.resolve(_.omit(module, 'hash'));
        } else {
            // module not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

// function is for submit Exam and give result of module 
function submitExam(testData) { // testData , moduleid , username
    var deferred = Q.defer();
    db.collection("examresmodules").findOne({
        'moduleid': testData.moduleid
    }, function (err, res) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (res) {
            compareDataPromise = compareResult(res, testData);
            compareDataPromise.then(function (response) {
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        } else {
            deferred.reject({
                'name': testData.username,
                'message': 'there is no module'
            });
        }
    });
    return deferred.promise;
}

// compare and gives result 
function compareResult(response, request) {
    var deferred = Q.defer();
    var count = 0;
    if (response.result.length === request.answerSheets.length) {
        for (var i = 0; i < response.result.length; i++) {
            if (request.answerSheets[i].answer === '') {
                continue;
            } else {
                if (parseInt(request.answerSheets[i].id) === parseInt(response.result[i].id) && answerKey[request.answerSheets[i].answer] === response.result[i].answer) {
                    count++;
                }
            }
        }
        examAttemptPromise = examAttempt(response, request.username, request.moduleid, count);
        examAttemptPromise.then(function (attemptSuccess) {
            if (attemptSuccess) {
                deferred.resolve(attemptSuccess);
            } else {
                deferred.reject({
                    'username': response.username,
                    'error': 'FAILED TO SUBMIT EXAM'
                });
            }

        });
    } else {
        deferred.reject({
            'error': 'question length is not proper'
        });
    }
    return deferred.promise;
}

function examinup(what, username, moduleid, attempt_time) {
    var deferred = Q.defer();
    if (what === 'insert') {
        db.collection("exam_attempt").insert({
                "userid": username,
                "attempt_time": attempt_time + 1,
                "trndate": new Date().toISOString(),
                "moduleid": moduleid,
                "hash": bcrypt.hashSync(username, 10)
            },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                if (doc) {
                    deferred.resolve(true);
                } else {
                    deferred.reject(false);
                }
            });
    } else if (what === 'update') {
        db.collection("exam_attempt").update({"userid": username, "moduleid": moduleid}, {
                $set: {"trndate": new Date().toISOString(), "attempt_time": attempt_time + 1}
            },
            function (err, doc) {
                if (err) deferred.reject(false);
                if (doc) {
                    deferred.resolve(true);
                } else {
                    deferred.reject(false);
                }
            });
    }
    return deferred.promise;
}
function examAttempt(response, username, moduleid, count) {
    var percentage = 0;
    var status = '';
    var deferred = Q.defer();
    db.collection("exam_attempt").findOne({
        'userid': username,
        'moduleid': moduleid
    }, function (err, examAttempt) {
        if (examAttempt) {
            exampromise = examinup('update', username, moduleid, examAttempt.attempt_time);
        } else {
            exampromise = examinup('insert', username, moduleid, 0);
        }
        exampromise.then(function (res) {
            percentage = count * 100 / response.result.length;
            if (percentage >= config.passmarks) {
                status = 'PASS';
                db.collection("exam_result").insert({
                    "moduleid": moduleid,
                    "userid": username,
                    "result": status,
                    "trndate": new Date().toISOString(),
                    "hash": bcrypt.hashSync(username, 10)
                }, function (examResult, examResultSuccess) {
                    if (examResultSuccess) {
                        deferred.resolve({
                            'username': username,
                            'totalResult': percentage,
                            'status': status
                        });
                    }
                });
            } else {
                status = 'FAIL';
                var modulePromise = videoService.findmodule(moduleid);
                modulePromise.then(function (responseModule) {
                    if (responseModule) {
                        db.collection(responseModule.collection).update({"userid": username}, {$set: {videostatus: 'notwatched'}}, {"multi": true}, function (err, response) {
                            if (response) {
                                deferred.resolve({
                                    'username': username,
                                    'totalResult': percentage,
                                    'status': status
                                });
                            } else {
                                deferred.reject({
                                    'name': username,
                                    'message': "Failed To Submit Test"
                                });
                            }
                        });
                    }
                }).catch(function (errorModule) {
                    deferred.reject({
                        'videoid': request.moduleid,
                        'message': "there is no moduleinformation found"
                    });
                })
            }
        }).catch(function (err) {
            deferred.reject({
                'name': username,
                'message': "Failed to Attempt Exam"
            })
        })
    });
    return deferred.promise;
}

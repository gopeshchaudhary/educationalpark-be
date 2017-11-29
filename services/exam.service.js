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
function submitExam(testData) {                                // testData , moduleid , username
    var deferred = Q.defer();
    db.collection("examresmodules").find({
        'moduleid': testData.moduleid
    }).toArray(function (err, res) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (res && res[0] && res[0].moduleid) {
            compareData = compareResult(res[0], testData);
            compareData.then(function (response) {
                deferred.resolve(response);
            }).catch(function (error) {
                deferred.reject(error);
            });
        } else {
            deferred.reject({
                'name': req.moduleid,
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
    var percentage = 0;
    var status = '';
    if (response.result.length === request.answerSheets.length) {
        for (var i = 0; i < response.result.length; i++) {
            if (request.answerSheets[i].answer === '') {
                continue;
            } else {
                if (request.answerSheets[i].id === response.result[i].id && answerKey[request.answerSheets[i].answer] === response.result[i].answer) {
                    count++;
                }
            }
        }
        var percentage = count * 100 / response.result.length;
        if (percentage >= 60) {
            status = 'pass';
            deferred.resolve({
                'totalResult': percentage,
                'status': status
            });
        } else {
            status = 'fail';
            var modulePromise = videoService.findmodule(request.moduleid);
            modulePromise.then(function (errorModule, responseModule) {
                if (errorModule) deferred.reject(errorModule.name + ': ' + errorModule.message);
                if (responseModule) {
                    db.collection(responseModule.collection).find({
                        'userid': request.username
                    }).toArray(function (err, video) {
                        if (err) deferred.reject(err.name + ': ' + err.message);
                        if (video) {
                            updateStatusPromise = updateStatus(responseModule.collection, status, percentage);
                            updateStatusPromise.then(function (response) {
                                deferred.resolve(response);
                            }).catch(function (error) {
                                deferred.reject(error);
                            });
                        } else {
                            // aut  hentication failed
                            deferred.reject({
                                'videoid': body.videoid,
                                'message': "there is no video regarding username"
                            });
                        }
                    });
                } else {
                    deferred.reject({
                        'videoid': request.moduleid,
                        'message': "there is no module"
                    });
                }
            })


        }

    } else {
        deferred.reject({
            'error': 'question length is not proper'
        });
    }
    return deferred.promise;
}

function updateStatus(collectionData, status, percentage) {
    var deferred = Q.defer();
    // fields to update
    var set = {
        videostatus: 'notwatched'
    };
    db.collection(collectionData).update({
            $set: set
        },
        {multi: true},
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            if (doc) {
                deferred.resolve({
                    'totalResult': percentage,
                    'status': status,
                    allVideo: 'false'
                });
            }
        });
    return deferred.promise;
}
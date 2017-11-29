/**
 * Created by tigerking on 22/11/17.
 */
var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
    native_parser: true
});
db.bind('exammodules');



var examservice = {};

examservice.getExamSet = getExamSet;
//examservice.validate = validateexam;
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
function submitExam(req) {
    var deferred = Q.defer();
    db.collection("examresmodules").find({
        'moduleid': req.testData.moduleid
    }).toArray(function (err, res) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (res && res[0] && res[0].moduleid) {
           compareData = compareResult(res[0],req.testData);
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
        for(var i =0;i<response.result.length;i++){
                if(request.answerSheets[i].answer===''){
                    continue;
                }else{
                    if( request.answerSheets[i].id===response.result[i].id && answerKey[request.answerSheets[i].answer]===response.result[i].answer){
                        count++;  
                    }
                }
        }
        var percentage = count * 100 / response.result.length;
        if (percentage >= 60) {
            status = 'pass';
        } else {
            status = 'fail';
        }
        deferred.resolve({
            'totalResult': percentage,
            'status': status
        });
    } else {
        deferred.reject({
            'error': 'question length is not proper'
        });
    }
    return deferred.promise;
}
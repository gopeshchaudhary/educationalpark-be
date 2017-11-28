/**
 * Created by tigerking on 22/11/17.
 */
var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {native_parser: true});
db.bind('exammodules');


var examservice = {};

examservice.getExamSet = getExamSet;
examservice.validate = validateexam;

module.exports = examservice;

function getExamSet(moduleid) {
    var deferred = Q.defer();
    db.exammodules.find({'moduleid': moduleid}).toArray(function (err, module) {
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

function validateexam() {

}

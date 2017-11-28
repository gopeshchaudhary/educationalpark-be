var config = require('config.json');
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {native_parser: true});
db.bind('users');

var service = {};

service.getUserProfile = getUserProfile;
service.updateUserProfile = updateUserProfile;


module.exports = service;

function getUserProfile(username) {
    var deferred = Q.defer();
    db.users.findOne({'username': username}, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (user) {
            deferred.resolve({
                _id: user._id,
                username: user.username,
                emailID: user.emailID,
                phoneNo: user.phoneNo
            });
        } else {
            // authentication failed
            deferred.resolve();
        }
    });
    return deferred.promise;
}
// profile update for corresponding user
function updateUserProfile(userParam) {
    var deferred = Q.defer();
    // validation
    db.users.findOne({'username': userParam.username}, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (bcrypt.compareSync(userParam.oldPassword, user.hash)) {
            if (!bcrypt.compareSync(userParam.oldPassword, bcrypt.hashSync(userParam.newPassword, 10))) {
                // passsword has changed so check if the new password is already taken
                updateUserPromise = updateUser(user._id, userParam);
                updateUserPromise.then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            } else {
                deferred.reject({"name": userParam.username, "message": "no new password"});
            }

        } else {
            deferred.reject({"name": userParam.username, "message": "old password is incorrect"});
        }
    });
    return deferred.promise;
}
function updateUser(id, userParam) {
    var deferred = Q.defer();
    // fields to update
    var set = {};
    // update password if it was entered
    if (userParam.newPassword) {
        set.hash = bcrypt.hashSync(userParam.newPassword, 10);
    } else {
        deferred.reject({"name": userParam.username, "message": "update failed"});
    }
    db.users.update(
        {_id: mongo.helper.toObjectID(id)},
        {$set: set},
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            if (doc) {
                deferred.resolve({
                    username: userParam.username,
                    status: "updated"
                });
            }
        });
    return deferred.promise;
}

function initProfile(username){
    var deferred = Q.defer();
    // fields to insert
    db.collection('moduleinfo').find({}).toArray(function (err,status) {
       console.log(status);
    });
    var set = {
        pass: userParam.newPassword
    };
    // update password if it was entered
    if (userParam.newPassword) {
        set.hash = bcrypt.hashSync(userParam.newPassword, 10);
    } else {
        deferred.reject({"name": userParam.username, "message": "update failed"});
    }
    db.users.update(
        {_id: mongo.helper.toObjectID(id)},
        {$set: set},
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            if (doc) {
                deferred.resolve({
                    username: userParam.username,
                    status: "updated"
                });
            }
        });
    return deferred.promise;
}
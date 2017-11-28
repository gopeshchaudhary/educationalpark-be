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
    db.users.findOne({'username': username},function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (user) {
            deferred.resolve({
                _id: user._id,
                username: user.username,
                userName: user.userName,
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
        if (user.hash !== bcrypt.hashSync(userParam.oldPassword, 10)) {
            // passsword has changed so check if the new password is already taken
                updateUser(user._id,userParam);
                deferred.resolve(user);
        } 
    });
    return deferred.promise;
}

function updateUser(id,userParam) {
    // fields to update
    var set = {
        pass: userParam.newPassword
    };
    // update password if it was entered
    if (userParam.newPassword) {
        set.hash = bcrypt.hashSync(userParam.newPassword, 10);
    }
    db.users.update(
        {_id: mongo.helper.toObjectID(id)},
        {$set: set},
        function (err, doc) {
        if (err) throw err.message;

          
        });
}
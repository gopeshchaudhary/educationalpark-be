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
service.initProfile = initProfile;
service.getDashboard = getDashboard;
service.getSections = getSections;

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

function initProfile(username) {
    var deferred = Q.defer();
    // fields to insert
    db.collection('moduleinfo').find({}).toArray(function (err, modules) {
        modules.forEach(function (moduleObj) {
            var module = moduleObj.moduleid;
            var collection = moduleObj.collection;
            db.collection('videorecord').find({"modulecode": module}).toArray(function (err, videos) {
                videos.forEach(function (videoObj) {
                    db.collection(collection).insert({
                        "videoid": videoObj.videoID,
                        "userid": username,
                        "videostatus": "notwatched",
                        "trndate": new Date().toISOString(),
                        "hash": bcrypt.hashSync(username + videoObj.videoID, 10)
                    });
                })
            });
        });
        deferred.resolve();
    });
    return deferred.promise;
}

function getDashboard(username, sectionid) {
    var deferred = Q.defer();
    // get the modules
    db.collection('moduleinfo').find({"sectionid": sectionid}).toArray(function (err, modules) {
        if (modules.length) {
            var response = {"user": username, "section": sectionid};
            modules.forEach(function (moduleObj) {
                var module = moduleObj.moduleid;
                var collection = moduleObj.collection;
                response.modules = [];
                db.collection('videorecord').find({"modulecode": module}).toArray(function (err, videos) {
                    if (videos.length) {
                        var videoList = {};
                        videos.forEach(function (videoObj) {
                            videoList[videoObj.videoID] = {};
                            videoList[videoObj.videoID].url = videoObj.path_video;
                        });
                        db.collection(collection).find({"userid": username}).toArray(function (err, usermoudleinfo) {
                            if (usermoudleinfo.length) {
                                var watchcount = 0;
                                usermoudleinfo.forEach(function (usermoduleObj) {
                                    if (usermoduleObj.videostatus !== "notwatched") {
                                        watchcount++;
                                    }
                                    videoList[usermoduleObj.videoid].status = usermoduleObj.videostatus;
                                });
                                response.modules.push({"moduleid": module, "videolist": videoList});
                                if (watchcount !== usermoudleinfo.length) {
                                    deferred.resolve(response);
                                }
                            } else {
                                deferred.reject({"name": username, "message": "No Video Info Found In Module"});
                            }
                        })
                    }
                });
            });
        } else {
            deferred.reject({"name": username, "message": "invalid section provided"});
        }
    });
    return deferred.promise;
}

function getSections(username) {
    var deferred = Q.defer();
    // fields to insert
    db.collection('sections').find({}).toArray(function (err, sections) {
        if (sections.length) {
            var response = [];
            sections.forEach(function (sectionObj) {
                response.push({"name": sectionObj.name, "sectionid": sectionObj.sectionid});
            });
            deferred.resolve(response);
        } else {
            deferred.reject({"name": username, "message": "No Sections Found"});
        }
    });
    return deferred.promise;
}
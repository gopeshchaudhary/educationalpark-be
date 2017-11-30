var config = require('config.json');
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var userService = require('./user.service');
var db = mongo.db(config.connectionString, {
    native_parser: true
});

var videoService = {};

videoService.videoUpdateStatus = videoUpdateStatus;
videoService.findmodule = findmodule;

module.exports = videoService;
// function for video update 
function videoUpdateStatus(username, videoid, moduleid) {
    var deferred = Q.defer();
    var selectedCollection = '';
    if (userService.checkUserName(username)) {
        var collectionData = findmodule(moduleid);
        collectionData.then(function (res) {
            selectedCollection = res.collection;
            db.collection(selectedCollection).find({
                'videoid': parseInt(videoid,10),
                'userid': username
            }).toArray(function (err, video) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                if (video) {
                    updateStatusPromise = updateStatus(selectedCollection, video[0]._id, moduleid);
                    updateStatusPromise.then(function (response) {
                        deferred.resolve(response);
                    }).catch(function (error) {
                        deferred.reject(error);
                    });
                } else {
                    // aut  hentication failed
                    deferred.reject({
                        'videoid': videoid,
                        'message': "there is no video regarding username"
                    });
                }
            });
        });
    } else {
        deferred.reject({
            'username': username,
            'message': 'username is not found'
        });
    }
    return deferred.promise;
}

function findmodule(moduleid) {
    var deferred = Q.defer();
    db.collection("moduleinfo").findOne({
        'moduleid': moduleid
    }, function (error, result) {
        if (result) {
            deferred.resolve(result);
        } else {
            deferred.reject({
                'error': 'there is no module for video'
            });
        }
    });
    return deferred.promise;
}

function updateStatus(selectedCollection, id, moduleid) {
    var deferred = Q.defer();
    // fields to update
    var set = {
        videostatus: 'watched',
        trndate: new Date().toISOString()
    };
    db.collection(selectedCollection).update({
            _id: mongo.helper.toObjectID(id)
        }, {
            $set: set
        },
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            if (doc) {
                db.collection("videorecord").find({
                    'modulecode': moduleid,
                }).toArray(function (err, res) {
                    if (err) deferred.reject(err.name + ': ' + err.message);
                    if (res) {
                        db.collection(selectedCollection).find({'videostatus': 'watched'}).toArray(function (err, watchedVideo) {
                            if (err) deferred.reject(err.name + ':' + err.message);
                            if (watchedVideo.length === res.length) {
                                deferred.resolve({
                                    videoStatus: "updated",
                                    allVideo: 'true'
                                });
                            } else {
                                deferred.resolve({
                                    videoStatus: "updated",
                                    allVideo: 'false'
                                });
                            }
                        })
                    } else {
                        deferred.reject({
                            'error': moduleid,
                            'message': 'there is no video regarding module'
                        });
                    }
                });


            } else {
                deferred.reject({
                    'error': moduleid,
                    'message': 'there is error in update'
                });
            }
        });
    return deferred.promise;
}


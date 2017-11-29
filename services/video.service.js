var config = require('config.json');
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var userService = require('./user.service');
var db = mongo.db(config.connectionString, {native_parser: true});

var videoService = {};

videoService.videoUpdateStatus = videoUpdateStatus;

module.exports = videoService;
// function for video update 
function videoUpdateStatus(body){
    var deferred = Q.defer();
    var selectedCollection = '';
    if(userService.checkUserName(body.username)){
    var collectionData=  findmodule(body.moduleid);
    collectionData.then(function(res){
     selectedCollection =  res.collection;
     db.collection(selectedCollection).findOne({'videoid':body.videoid,'userid':body.username}, function (err, video) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (video) {
          updateStatusPromise = updateStatus(selectedCollection,video._id);
          updateStatusPromise.then(function (response) {
            deferred.resolve(response);
        }).catch(function (error) {
            deferred.reject(error);
        });
        } else {
            // aut  hentication failed
            deferred.reject({'videoid':body.videoid,'message':"there is no video regarding username"});
        }
    });
    });
    }else{
        deferred.reject({'username':body.username,'message':'username is not found'});
    }
    return deferred.promise;
};

function findmodule(moduleid){  
    var deferred = Q.defer();
    db.collection("moduleinfo").findOne({'moduleid':moduleid},function(error,result){
        if(result){
         deferred.resolve(result);
        }else{
            deferred.reject({'error':'there is no module for video'});
        }
    });
    return deferred.promise;
}

function updateStatus(selectedCollection,id){
    var deferred = Q.defer();
    // fields to update
    var set = {
        videostatus: 'watched',
        trndate:new Date().toISOString()
    };
    db.collection(selectedCollection).update(
        {_id: mongo.helper.toObjectID(id)},
        {$set: set},
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            if (doc) {
                deferred.resolve({
                    videoStatus: "updated"
                });
            }
        });
    return deferred.promise;
};
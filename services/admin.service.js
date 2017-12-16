var config = require('config.json');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
    native_parser: true
});

var adminservice = {};

adminservice.getUsers = getUsersList;
adminservice.getSectionList = getSectionList;
adminservice.getModuleList = getModuleList;
adminservice.videosModules = videoModules;
adminservice.getModuleStatus = getModuleStatus;
module.exports = adminservice;

function getUsersList(username) {
    var deferred = Q.defer();
    db.collection('users').find({}).toArray(function (err, users) {
        if (users.length) {
            var response = [];
            users.forEach(function (usersObj) {
                response.push({
                    "name": usersObj.username,
                    "phoneNo": usersObj.phoneNo,
                    "emailID": usersObj.emailID,
                    "datetime": usersObj.timestamp
                });
            });
            deferred.resolve(response);
        } else {
            deferred.reject({"name": username, "message": "No Users Found"});
        }
    });
    return deferred.promise;
}

function videoModules() {
    var deferred = Q.defer();
    db.collection('');
    return deferred.promise;
}
function getSectionList(username) {
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

function getModuleList(username, sectionid) {
    var deferred = Q.defer();
    db.collection('moduleinfo').find({"sectionid": sectionid}).sort({"moduleid": 1}).toArray(function (err, modules) {
        if (err) deferred.reject(err.name + err.message);
        if (modules.length) {
            var response = [];
            modules.forEach(function (moduleObj) {
                response.push(moduleObj.moduleid);
            });
            deferred.resolve(response);
        } else {
            deferred.resolve({"name": username, "message": "No Modules Found"});
        }
    });
    return deferred.promise;
}

function getModuleStatus(username, moduleid) {
    var deferred = Q.defer();
    db.collection('moduleinfo').find({"moduleid": moduleid}).toArray(function (err, moduleinfo) {
        if (err) deferred.reject(err.name + err.message);
        if (moduleinfo.length) {
            var response = [];
            var collection = moduleinfo[0].collection;
            db.collection(collection).find({"userid": username}).toArray(function (err, videolist) {
                if (!videolist.length) deferred.reject(err.name + ': ' + err.message);
                var examstatus = 'FAIL';
                db.collection("exam_result").find({
                    "userid": username,
                    "moduleid": moduleid
                }).toArray(function (err, examattempt) {
                    if (err) deferred.reject(err.name + ': ' + err.message);
                    if (examattempt.length) {
                        examstatus = examattempt[0].result;
                    }
                    videolist.forEach(function (videolist) {
                        response.push({
                            "videoid": videolist.videoid,
                            "videostatus": videolist.videostatus,
                            "examstatus": examstatus
                        });
                    });
                    deferred.resolve(response);
                });
            });
        } else {
            deferred.resolve({"name": username, "message": "No Videos Found in Module"});
        }
    });
    return deferred.promise;
}


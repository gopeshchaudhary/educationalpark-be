var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var request = require('request');
var Q = require('q');
var jsSHA = require('../helpers/sha1');
var topOtp = require('../helpers/topgun');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {native_parser: true});
db.bind('otp');

var totpObj = new TOTP(jsSHA);
var otp = totpObj.getOTP(config.secret);

var otpservice = {};

otpservice.generate = generate;
otpservice.validate = validate;
otpservice.sendmail = sendmail;

module.exports = otpservice;
function generate(username, mobileno) {
    var deferred = Q.defer();
    db.collection('users').findOne({username: username}, function (err, user) {
        if (user) {
            // user exists
            deferred.reject({"name": username, "message": "user already exists"});
        } else {
            otpresponse = makeAPICall(otp, mobileno);
            otpresponse.then(function (response) {
                db.otp.insert({
                    username: username,
                    mobileno: mobileno,
                    otp: otp,
                    timestamp: new Date().toISOString(),
                    apiresponse: response
                }, function (err, success) {
                    if (err) deferred.reject(err.name + ': ' + err.message);
                    if (success) {
                        // authentication successful
                        deferred.resolve({
                            username: username,
                            otp: "success"
                        });
                    } else {
                        // otp failed
                        deferred.resolve();
                    }
                });
            }).catch(function (err) {
                deferred.reject({"name": username, "message": err})
            });
        }
    });
    return deferred.promise;
}
function validate(username, otp) {
    var deferred = Q.defer();
    db.otp.findOne({
        username: username,
        otp: otp
    }, function (err, success) {
        if (err) {
            db.otp.remove({"username": username});
            deferred.reject(err.name + ': ' + err.message);
        }
        if (success) {
            // authentication successful
            db.otp.update(
                {"name": username},
                {
                    $set: {"status": "verified"}
                }
                , function (err, success) {
                    if (err) deferred.reject(err.name + ': ' + err.message);
                    if (success) {
                        deferred.resolve({
                            username: username,
                            status: "verified"
                        });
                    }
                });
        } else {
            // otp failed
            db.otp.remove({"username": username});
            deferred.reject({
                name: username,
                message: "failed"
            });
        }
    });
    return deferred.promise;
}
function makeAPICall(otp, mobileno) {
    var deferred = Q.defer();
    request.post(
        config.otpservice,
        {
            json: {
                "otpcontent": " Hello, your OTP for this registration is " + otp,
                "mobilenumber": mobileno,
                "username": "edu portal"
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body) {
                    deferred.resolve(JSON.stringify(body));
                }
            } else {
                deferred.reject('ERROR WHILE SENDING OTP');
            }
        }
    );
    return deferred.promise;
}
function sendmail(username, mobileno, email) {
    var deferred = Q.defer();
    db.collection('users').findOne({username: username}, function (err, user) {
        if (user) {
            // user exists
            deferred.reject({"name": username, "message": "user already exists"});
        } else {
            emailresponse = sendMailAPI(username, mobileno, email);
            emailresponse.then(function (response) {
                db.collection('users').insert({
                    username: username,
                    phoneNo: mobileno,
                    emailID: email,
                    timestamp: new Date().toISOString(),
                    hash: bcrypt.hashSync(response.password, 10)
                }, function (err, success) {
                    if (err) deferred.reject(err.name + ': ' + err.message);
                    if (success) {
                        deferred.resolve({
                            username: username,
                            emailsend: "success"
                        });
                    } else {
                        deferred.resolve();
                    }
                });
            }).catch(function (err) {
                deferred.reject({"name": username, "message": err})
            });
        }
    });

    return deferred.promise;
}
function sendMailAPI(username, mobileno, email) {
    var deferred = Q.defer();
    var randomstring = Math.random().toString(36).slice(-8);
    var content = " Hello " + username + ",\n Thanks for registering on Edupark , Your Mobile Number is " + mobileno + " . \nYour password is : " + randomstring + " \n Enjoy our services.";
    request.post(
        config.emailservice,
        {
            json: {
                "content": content,
                "emailId": email,
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body) {
                    deferred.resolve({'password': randomstring});
                }
            } else {
                deferred.reject('ERROR WHILE SENDING EMAIL');
            }
        }
    );
    return deferred.promise;
}

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

module.exports = otpservice;

function generate(username, mobileno) {
    console.log(username, mobileno, 'genrated otp ' + otp);
    var deferred = Q.defer();
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
        deferred.reject(err)
    });
    return deferred.promise;
}

function validate(username, otp) {
    var deferred = Q.defer();
    console.log(username,otp);
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
            deferred.resolve({
                username: username,
                status: "failed"
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
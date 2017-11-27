var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');

var jsSHA = require('../helpers/sha1');
var topOtp = require('../helpers/topgun');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('users');

var totpObj = new TOTP(jsSHA);
var otp = totpObj.getOTP(config.secret);

var otpservice = {};

otpservice.generate = generate;
otpservice.validate = validate;

module.exports = otpservice;

function generate() {
    console.log('genrated otp ' + otp)

}

function validate() {

}
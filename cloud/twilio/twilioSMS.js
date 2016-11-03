var winston = require('winston');
var twilio = require("twilio")(process.env.TWILIO_ID, process.env.TWILIO_KEY);

module.exports = {
    sendSMS: function(phoneNumber, validationCode, callback) {
        winston.info("Sending message from twilio");
        var twilioPromise = twilio.sendMessage({
            From: process.env.TWILIO_PHONE_NUM,
            To: "+1" + phoneNumber,
            Body: "Welcome to use VMWatch, your validation code is " + validationCode
        });
        twilioPromise.then(function(message) {
            winston.info("SMS Message Success");
            callback(null, "Message Sent");
        }, function(error) {
            winston.error("SMS Message Fail");
            callback("SMS Error", null);
        });
    }
};

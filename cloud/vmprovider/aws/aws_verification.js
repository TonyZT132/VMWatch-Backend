var logger = require('winston');

module.exports = {
    ec2UserVerification: function(accessID, accessKey, callback) {
        var AWS = require('aws-sdk');
        AWS.config.update({
            accessKeyId: accessID,
            secretAccessKey: accessKey,
        });

        var iam = new AWS.IAM();
        iam.getAccountSummary(function(err, data) {
            if (err) {
                if (String(err.code) == "InvalidClientTokenId" || String(err.code) == "SignatureDoesNotMatch") {
                    logger.error(err.message);
                    callback("Invalid access credential", null);
                } else {
                    callback(null, "Valid access credential");
                }
            } else {
                logger.info("Valid Access ID");
                callback(null, "Valid access credential");
            }
        });
    },
};

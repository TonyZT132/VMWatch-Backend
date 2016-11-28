var winston = require('winston');

module.exports = {
    getCPUUtilization: function(accessID, accessKey, instanceID, instanceRegion, callback) {
        winston.info('Getting metrics from AWS EC2');
        var startDate = getStartTime(new Date(), 20);
        try {
            var AWS = require('aws-sdk');
            AWS.config.update({
                accessKeyId: accessID,
                secretAccessKey: accessKey,
                region: instanceRegion
            });

            var cloudwatch = new AWS.CloudWatch();
            var params = {
                Namespace: "AWS/EC2",
                Dimensions: [{
                    Name: "InstanceId",
                    Value: instanceID
                }],
                Unit: "Percent",
                Statistics: ["Average", "Maximum", "Minimum"],
                MetricName: "CPUUtilization",
                StartTime: startDate,
                EndTime: new Date(),
                Period: 300
            };

            cloudwatch.getMetricStatistics(params, function(cloudWatchErr, response) {
                var data = null;
                var error = null;

                if (cloudWatchErr) {
                    winston.error("Error: " + err);
                    callback(error, data);
                } else {
                    try {
                        winston.info("Sucessfully get data from CloudWatch");
                        data = response;
                    } catch (exception) {
                        error = exception;
                    } finally {
                        winston.info("Returning data");
                        callback(error, data);
                    }
                }
            });
        } catch (err) {
            winston.info("Error catched from AWS SDK");
            callback(err.message, null);
        }
    }

    getNetworkOut: function(accessID, accessKey, instanceID, instanceRegion, callback) {
        winston.info('Getting metrics from AWS EC2');
        var startDate = getStartTime(new Date(), 20);
        try {
            var AWS = require('aws-sdk');
            AWS.config.update({
                accessKeyId: accessID,
                secretAccessKey: accessKey,
                region: instanceRegion
            });

            var cloudwatch = new AWS.CloudWatch();
            var params = {
                Namespace: "AWS/EC2",
                Dimensions: [{
                    Name: "InstanceId",
                    Value: instanceID
                }],
                Unit: "Bytes",
                Statistics: ["Average", "Maximum", "Minimum"],
                MetricName: "NetworkOut",
                StartTime: startDate,
                EndTime: new Date(),
                Period: 300
            };

            cloudwatch.getMetricStatistics(params, function(cloudWatchErr, response) {
                var data = null;
                var error = null;

                if (cloudWatchErr) {
                    winston.error("Error: " + err);
                    callback(error, data);
                } else {
                    try {
                        winston.info("Sucessfully get data from CloudWatch");
                        data = response;
                    } catch (exception) {
                        error = exception;
                    } finally {
                        winston.info("Returning data");
                        callback(error, data);
                    }
                }
            });
        } catch (err) {
            winston.info("Error catched from AWS SDK");
            callback(err.message, null);
        }
    }
};

function getStartTime(date, minutes) {
    return new Date(date.getTime() - minutes*60000);
}

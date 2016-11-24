var winston = require('winston');

module.exports = {
    getCPUUtilizationAverage: function(accessID, accessKey, instanceID, instanceRegion, callback) {
        winston.info('Getting metrics from AWS EC2');
        var startDate = new Date();
        startDate.setHours(startDate.getHours() - 1)

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
                Statistics: ["Average"],
                MetricName: "CPUUtilization",
                StartTime: startDate,
                EndTime: new Date(),
                Period: 600
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
            callback(err.message, data);
        }
    }
};

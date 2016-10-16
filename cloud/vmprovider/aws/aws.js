var winston = require('winston');

module.exports = {
    getEC2Metrics: function (accessID, accessKey, instanceID, instanceRegion, callback) {
        winston.info('Getting metrics from AWS EC2');
        var startDate = new Date((new Date) * 1 - 1000 * 300);

        var AWS = require('aws-sdk');
        AWS.config.update({
            accessKeyId: accessID,
            secretAccessKey: accessKey,
            region: instanceRegion
        });

        var cloudwatch = new AWS.CloudWatch();
        var params = {
            Namespace  : "AWS/EC2",
            Dimensions : [{
                Name:  "InstanceId",
                Value: instanceID
            }],
            Unit: "Percent",
            Statistics :["Average"],
            MetricName : "CPUUtilization",
            StartTime  : startDate,
            EndTime    : new Date(),
            Period     : 300
        };

        cloudwatch.getMetricStatistics(params, function(cloudWatchErr, response) {
            var data = null;
            var error = null;

            if (cloudWatchErr) {
                winston.error("Error: "+ err);
                callback(error, data);
            }

            try {
                winston.info("Sucessfully get data from CloudWatch");
                data = response;
            } catch (exception) {
                error = exception;
            } finally {
                winston.info("Returning data");
                callback(error, data);
            }
        });
    }
};

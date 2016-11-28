var winston = require('winston');

module.exports = {
    getMonitoringData: function(accessID, accessKey, instanceID, instanceRegion, metrics, range, callback) {
        winston.info('Getting metrics from AWS EC2');
        var startDate = getStartTime(new Date(), range);
        try {
            var AWS = require('aws-sdk');
            AWS.config.update({
                accessKeyId: accessID,
                secretAccessKey: accessKey,
                region: instanceRegion
            });

            var cloudwatch = new AWS.CloudWatch();
            var params = getParams(instanceID, startDate, metrics);

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
    return new Date(date.getTime() - minutes * 60000);
}

function getParams(instanceID, startDate, metrics) {
    switch (metrics) {
        case "CPUUtilization":
            return cpuUtilizationParams(instanceID, startDate);
        case "NetworkIn":
            return networkInParams(instanceID, startDate);
        case "NetworkOut":
            return networkOutParams(instanceID, startDate);
        default:
            return null;
    }
}

function cpuUtilizationParams(instanceID, startDate) {
    return {
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
}

function networkInParams(instanceID, startDate) {
    return {
        Namespace: "AWS/EC2",
        Dimensions: [{
            Name: "InstanceId",
            Value: instanceID
        }],
        Unit: "Bytes",
        Statistics: ["Average", "Maximum", "Minimum"],
        MetricName: "NetworkIn",
        StartTime: startDate,
        EndTime: new Date(),
        Period: 300
    };
}

function networkOutParams(instanceID, startDate) {
    return {
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
}

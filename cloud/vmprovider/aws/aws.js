var winston = require('winston');

module.exports = {
    ec2UserVerification: function(accessID, accessKey) {
        var AWS = require('aws-sdk');
        AWS.config.update({
            accessKeyId: accessID,
            secretAccessKey: accessKey,
        });

        var iam = new AWS.IAM();
        iam.getAccountSummary(function(err, data) {
            if (err) {
                winston.info("Wrong access id");
                winston.error(err, err.stack); // an error occurred
                winston.info(err.code);
                return false;
            }
            else {
                winston.info("Valid access id");
                winston.info(data); // successful response
                return true;
            }
        });
    },
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
                    error = cloudWatchErr
                    winston.error("Error: " + cloudWatchErr);
                    callback(error, data);
                } else {
                    winston.info("Sucessfully get data from CloudWatch");
                    data = response;
                    winston.info("Returning data");
                    callback(error, data);
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
        case "DiskReadBytes":
            return diskReadBytesParams(instanceID, startDate);
        case "DiskWriteBytes":
            return diskWriteBytesParams(instanceID, startDate);
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

function diskReadBytesParams(instanceID, startDate) {
    return {
        Namespace: "AWS/EC2",
        Dimensions: [{
            Name: "InstanceId",
            Value: instanceID
        }],
        Unit: "Bytes",
        Statistics: ["Average", "Maximum", "Minimum"],
        MetricName: "DiskReadBytes",
        StartTime: startDate,
        EndTime: new Date(),
        Period: 300
    };
}

function diskWriteBytesParams(instanceID, startDate) {
    return {
        Namespace: "AWS/EC2",
        Dimensions: [{
            Name: "InstanceId",
            Value: instanceID
        }],
        Unit: "Bytes",
        Statistics: ["Average", "Maximum", "Minimum"],
        MetricName: "DiskWriteBytes",
        StartTime: startDate,
        EndTime: new Date(),
        Period: 300
    };
}

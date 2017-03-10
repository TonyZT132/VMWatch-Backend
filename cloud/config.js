var SERVICE_CONFIG = {
    "service": [{
        "id": 0,
        "name": "aws",
        "icon":"aws-logo",
        "avaliable": true
    },{
        "id": 1,
        "name": "google",
        "icon":"google-logo",
        "avaliable": true
    },{
        "id": 2,
        "name": "azure",
        "icon":"azure-logo",
        "avaliable": false
    }],
};

var METRICS_EC2 = {
    "metrics": [{
        "name": "CPUUtilization",
        "range": 10
    }, {
        "name": "NetworkIn",
        "range": 60
    }, {
        "name": "NetworkOut",
        "range": 60
    }, {
        "name": "DiskReadBytes",
        "range": 60
    }, {
        "name": "DiskWriteBytes",
        "range": 60
    }],
};

exports.SERVICE_CONFIG = SERVICE_CONFIG;
exports.METRICS_EC2 = METRICS_EC2;

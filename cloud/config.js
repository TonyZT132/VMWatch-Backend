var SERVICE_CONFIG = {
    "service": [{
        "id": "0",
        "name": "aws",
        "avaliable": true
    }, {
        "id": "1",
        "name": "azure",
        "avaliable": false
    }, {
        "id": "2",
        "name": "google",
        "avaliable": false
    }, {
        "id": "3",
        "name": "heroku",
        "avaliable": false
    }, {
        "id": "4",
        "name": "vmware",
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

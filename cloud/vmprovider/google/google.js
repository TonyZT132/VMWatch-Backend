var winston = require('winston');

'use strict';
var async = require('async');
var google = require('googleapis');

var fs = require('fs');
var obj={};

var monitoringScopes = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/monitoring',
    'https://www.googleapis.com/auth/monitoring.read',
    'https://www.googleapis.com/auth/monitoring.write'
];

var METRIC_CPU = 'compute.googleapis.com/instance/cpu/utilization';
var METRIC_DISK_READ_COUNT = 'compute.googleapis.com/instance/disk/read_bytes_count';
var METRIC_DISK_WRITE_COUNT = 'compute.googleapis.com/instance/disk/write_bytes_count';
var METRIC_NETWORK_RECEIVED = 'compute.googleapis.com/instance/network/received_bytes_count';
var METRIC_NETWORK_SENT = 'compute.googleapis.com/instance/network/sent_bytes_count';



/**
* Returns an hour ago minus 5 minutes in RFC33339 format.
*/
function getStartTime () {
    var d = new Date();
    d.setHours(d.getHours());
    d.setMinutes(d.getMinutes() - 5);
    return JSON.parse(JSON.stringify(d).replace('Z', '000Z'));
}

/**
* Returns an hour ago in RFC33339 format.
*/
function getEndTime () {
    var d = new Date();
    d.setHours(d.getHours());
    return JSON.parse(JSON.stringify(d).replace('Z', '000Z'));
}

var ListResources = {
    /**
    * This Lists all the timeseries created between START_TIME and END_TIME
    * for our METRIC.
    * @param {googleAuthClient} authClient - The authenticated Google api client
    * @param {String} projectId - the project id
    * @param {requestCallback} callback - a function to be called when the server
    *     responds with the list of monitored resource descriptors
    */
    listTimeseries_CPU: function (authClient, projectId, instanceId,callback) {
        var monitoring = google.monitoring('v3');
        var startTime = getStartTime();
        var endTime = getEndTime();

        monitoring.projects.timeSeries.list({
            auth: authClient,
            filter: 'metric.type="' + METRIC_CPU + '" AND metric.label.instance_name = ' + instanceId,
            pageSize: 3,
            'interval.startTime': startTime,
            'interval.endTime': endTime,
            name: projectId
        }, function (err, timeSeries) {
            if (err) {
                winston.info(err);
                callback(err);
            } else {
                winston.info('get google cpu utilization');
                obj.cpu = timeSeries.timeSeries[0].points;
                /*fs.writeFile("./data.json", JSON.stringify(obj, null, 2) , 'utf-8');*/

                callback(null);
            }
        });
    },

    listTimeseries_DISK_READ: function (authClient, projectId, instanceID, callback) {
        var monitoring = google.monitoring('v3');
        var startTime = getStartTime();
        var endTime = getEndTime();

        monitoring.projects.timeSeries.list({
            auth: authClient,
            filter: 'metric.type="' + METRIC_DISK_READ_COUNT + '" AND metric.label.instance_name = ' + instanceID,
            pageSize: 3,
            'interval.startTime': startTime,
            'interval.endTime': endTime,
            name: projectId
        }, function (err, timeSeries) {
            if (err) {
                winston.info(err);
                callback(err);
            } else {
                obj.disk_read = timeSeries.timeSeries[0].points;
                /*fs.appendFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');*/
                winston.info('get google disk read');
                callback(null);
            }
        });
    },

    listTimeseries_DISK_WRITE: function (authClient, projectId, instanceID, callback) {
        var monitoring = google.monitoring('v3');
        var startTime = getStartTime();
        var endTime = getEndTime();

        monitoring.projects.timeSeries.list({
            auth: authClient,
            filter: 'metric.type="' + METRIC_DISK_WRITE_COUNT + '" AND metric.label.instance_name = ' + instanceID,
            pageSize: 3,
            'interval.startTime': startTime,
            'interval.endTime': endTime,
            name: projectId
        }, function (err, timeSeries) {
            if (err) {
                winston.info(err);
                callback(err);
            } else {
                obj.disk_write = timeSeries.timeSeries[0].points;
                //fs.appendFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
                winston.info('get google disk write');
                callback(null);
            }
        });
    },

    listTimeseries_NETWORK_RECEIVED: function (authClient, projectId, instanceID, callback) {
        var monitoring = google.monitoring('v3');
        var startTime = getStartTime();
        var endTime = getEndTime();

        monitoring.projects.timeSeries.list({
            auth: authClient,
            filter: 'metric.type="' + METRIC_NETWORK_RECEIVED + '" AND metric.label.instance_name = ' + instanceID,
            pageSize: 3,
            'interval.startTime': startTime,
            'interval.endTime': endTime,
            name: projectId
        }, function (err, timeSeries) {
            if (err) {
                winston.info(err);
                callback(err);
            } else {
                obj.network_received = timeSeries.timeSeries[0].points;
                //fs.appendFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
                winston.info('get google network recieved');
                callback(null);
            }
        });
    },

    listTimeseries_NETWORK_SENT: function (authClient, projectId, instanceID, callback) {
        var monitoring = google.monitoring('v3');
        var startTime = getStartTime();
        var endTime = getEndTime();

        monitoring.projects.timeSeries.list({
            auth: authClient,
            filter: 'metric.type="' + METRIC_NETWORK_SENT + '" AND metric.label.instance_name = ' + instanceID,
            pageSize: 3,
            'interval.startTime': startTime,
            'interval.endTime': endTime,
            name: projectId
        }, function (err, timeSeries) {
            if (err) {
                winston.info(err);
                callback(err);
            } else {
                obj.network_sent = timeSeries.timeSeries[0].points;
                //fs.appendFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
                winston.info('get google network sent');
                callback(null);
            }
        });
    },

    getMonitoringClient: function (callback) {
        google.auth.getApplicationDefault(function (err, authClient) {

            if (err) {
                return callback(err);
            }
            // Depending on the environment that provides the default credentials
            // (e.g. Compute Engine, App Engine), the credentials retrieved may
            // require you to specify the scopes you need explicitly.
            // Check for this case, and inject the Cloud Storage scope if required.
            if (authClient.createScopedRequired && authClient.createScopedRequired()) {
                authClient = authClient.createScoped(monitoringScopes);
            }
            callback(null, authClient);
        });
    }
};

module.exports = {
    getGoogleMonitoring: function(private_key_id, private_key,client_id, client_email, project_id, instance_id, callback) {
        winston.info('Setting client credentials for google cloud');
        winston.info(instance_id);
        try{
            var client_credential = {
                "type": "service_account",
                "project_id": project_id,
                "private_key_id": private_key_id,
                "private_key": private_key,
                "client_email": client_email,
                "client_id": client_id,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://accounts.google.com/o/oauth2/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/"+ client_email.split("@")[0] + "%40appspot.gserviceaccount.com"
            };
            fs.writeFile("./client_credential.json", JSON.stringify(client_credential), "utf-8");
            console.log(client_credential);
            process.env['GOOGLE_APPLICATION_CREDENTIALS'] = "client_credential.json";
            var projectName = 'projects/' + project_id;
            var authClient = "./service_account_file.json"
            ListResources.getMonitoringClient(function (err, authClient) {
                if (err) {
                    return callback(err,null);
                }
                winston.info('Successfully setting client credentials for google cloud');
                // Create the service object.
                ListResources.listTimeseries_CPU(authClient,projectName,instance_id,function(error){
                    if(error){
                        winston.info(error);
                        return callback(err,null);
                    }
                    ListResources.listTimeseries_DISK_READ(authClient,projectName,instance_id,function(error){
                        if(error){
                            return callback(err,null);
                        }
                        ListResources.listTimeseries_DISK_WRITE(authClient,projectName,instance_id,function(error){
                            if(error){
                                return callback(err,null);
                            }
                            ListResources.listTimeseries_NETWORK_SENT(authClient,projectName,instance_id,function(error){
                                if(error){
                                    return callback(err,null);
                                }
                                ListResources.listTimeseries_NETWORK_RECEIVED(authClient,projectName,instance_id,function(error){
                                    if(error){
                                        return callback(err,null);
                                    }
                                    winston.info("complete metrix retriving");
                                    callback(null,obj);
                                });
                            });
                        });
                    });
                });
                fs.unlink('./client_credential.json');

            });
        }catch (err) {
            winston.info("Error setting client credentials");
            callback(err.message, null);
        }
    }
}

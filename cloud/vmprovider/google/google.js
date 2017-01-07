var winston = require('winston');

'use strict';

var google = require('googleapis');
var async = require('async');


var client_credential = {
  "type": "service_account",
  "project_id": project_id,
  "private_key_id": private_key_id,
  "private_key": private_key,
  "client_email": project_id + "@appspot.gserviceaccount.com",
  "client_id": client_id,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/"+ project_id + "%40appspot.gserviceaccount.com"
};

var fs = require('fs');
fs.writeFile("./client_credential.json", JSON.stringify(client_credential), "utf-8");

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = "client_credential.json";

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
  listTimeseries_CPU: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    var startTime = getStartTime();
    var endTime = getEndTime();

    monitoring.projects.timeSeries.list({
      auth: authClient,
      filter: 'metric.type="' + METRIC_CPU + '" AND metric.label.instance_name = ' + instance_id,
      pageSize: 3,
      'interval.startTime': startTime,
      'interval.endTime': endTime,
      name: projectId
    }, function (err, timeSeries) {
      if (err) {
        return callback(err);
      }
      fs.writeFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
      console.log('Time series', timeSeries);
      callback(null, timeSeries);
    });
  },

  listTimeseries_DISK_READ: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    var startTime = getStartTime();
    var endTime = getEndTime();

    monitoring.projects.timeSeries.list({
      auth: authClient,
      filter: 'metric.type="' + METRIC_DISK_READ_COUNT + '" AND metric.label.instance_name = ' + instance_id,
      pageSize: 3,
      'interval.startTime': startTime,
      'interval.endTime': endTime,
      name: projectId
    }, function (err, timeSeries) {
      if (err) {
        return callback(err);
      }
      fs.appendFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
      console.log('Time series', timeSeries);
      callback(null, timeSeries);
    });
  },

  listTimeseries_DISK_WRITE: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    var startTime = getStartTime();
    var endTime = getEndTime();

    monitoring.projects.timeSeries.list({
      auth: authClient,
      filter: 'metric.type="' + METRIC_DISK_WRITE_COUNT + '" AND metric.label.instance_name = ' + instance_id,
      pageSize: 3,
      'interval.startTime': startTime,
      'interval.endTime': endTime,
      name: projectId
    }, function (err, timeSeries) {
      if (err) {
        return callback(err);
      }
      fs.appendFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
      console.log('Time series', timeSeries);
      callback(null, timeSeries);
    });
  },

  listTimeseries_NETWORK_RECEIVED: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    var startTime = getStartTime();
    var endTime = getEndTime();

    monitoring.projects.timeSeries.list({
      auth: authClient,
      filter: 'metric.type="' + METRIC_NETWORK_RECEIVED + '" AND metric.label.instance_name = ' + instance_id,
      pageSize: 3,
      'interval.startTime': startTime,
      'interval.endTime': endTime,
      name: projectId
    }, function (err, timeSeries) {
      if (err) {
        return callback(err);
      }
      fs.appendFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
      console.log('Time series', timeSeries);
      callback(null, timeSeries);
    });
  },

  listTimeseries_NETWORK_SENT: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    var startTime = getStartTime();
    var endTime = getEndTime();

    monitoring.projects.timeSeries.list({
      auth: authClient,
      filter: 'metric.type="' + METRIC_NETWORK_SENT + '" AND metric.label.instance_name = ' + instance_id,
      pageSize: 3,
      'interval.startTime': startTime,
      'interval.endTime': endTime,
      name: projectId
    }, function (err, timeSeries) {
      if (err) {
        return callback(err);
      }
      fs.appendFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
      console.log('Time series', timeSeries);
      callback(null, timeSeries);
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
      if (authClient.createScopedRequired &&
        authClient.createScopedRequired()) {
        authClient = authClient.createScoped(monitoringScopes);
      }
      callback(null, authClient);
    });
  }
};

exports.main = function (projectId, cb) {
  var projectName = 'projects/' + projectId;
  var authClient = "./service_account_file.json"
  ListResources.getMonitoringClient(function (err, authClient) {
    if (err) {
      return cb(err);
    }
    // Create the service object.
    async.series([
      function (cb) {
        ListResources.listTimeseries_CPU(
          authClient,
          projectName,
          cb
        );
      },
      function (cb) {
        ListResources.listTimeseries_DISK_READ(
          authClient,
          projectName,
          cb
        );
      },
      function (cb) {
        ListResources.listTimeseries_DISK_WRITE(
          authClient,
          projectName,
          cb
        );
      },
      function (cb) {
        ListResources.listTimeseries_NETWORK_SENT(
          authClient,
          projectName,
          cb
        );
      },
      function (cb) {
        ListResources.listTimeseries_NETWORK_RECEIVED(
          authClient,
          projectName,
          cb
        );
      }
    ]);
  });
};

if (require.main === module) {
  var args = process.argv.slice(2);
  exports.main(
    project_id,
    console.log
  );
}

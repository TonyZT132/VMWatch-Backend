var winston = require('winston');

'use strict';

var google = require('googleapis');
var async = require('async');



var fs = require('fs');
fs.writeFile("./client_credential.json", JSON.stringify(client_credential), "utf-8");

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = "client_credential.json";

var monitoringScopes = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/monitoring',
  'https://www.googleapis.com/auth/monitoring.read',
  'https://www.googleapis.com/auth/monitoring.write'
];

var METRIC = 'compute.googleapis.com/instance/cpu/usage_time';
//var METRIC = 'compute.googleapis.com/instance/disk/read_bytes_count';

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
  listTimeseries: function (authClient, projectId, callback) {
    var monitoring = google.monitoring('v3');
    var startTime = getStartTime();
    var endTime = getEndTime();

    monitoring.projects.timeSeries.list({
      auth: authClient,
      filter: 'metric.type="' + METRIC + '" AND metric.label.instance_name = "baobao"',
      pageSize: 3,
      'interval.startTime': startTime,
      'interval.endTime': endTime,
      name: projectId
    }, function (err, timeSeries) {
      if (err) {
        return callback(err);
      }
      var fs = require('fs');
      fs.writeFile("./data.json", JSON.stringify(timeSeries, null, 2) , 'utf-8');
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
        ListResources.listTimeseries(
          authClient,
          projectName,
          cb
        );
      }
    ], cb);
  });
};

if (require.main === module) {
  var args = process.argv.slice(2);
  exports.main(
    args[0] || process.env.GCLOUD_PROJECT,
    console.log
  );
}

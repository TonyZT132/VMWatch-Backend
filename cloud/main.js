var winston = require('winston');
// Include the Twilio Cloud Module
var twilioSMS = require('./twilio/twilioSMS');
var ec2Watch = require('./vmprovider/aws/aws');
var googleWatch = require('./vmprovider/google/google')

/*Request SMS Validation Code*/
Parse.Cloud.define("sendCode", function(request, response) {

    winston.info("Cloud function sendCode is called");
    var area = request.params.number.substring(0, 3);
    /*If Number is outside Toronto, return error*/
    if (area != 647 && area != 416 && area != 437) {
        response.error("Invalid Region Code");
    }

    /*Prepare the code*/
    var min = 1000;
    var max = 9999;
    var validationCode = Math.floor(Math.random() * (max - min + 1)) + min;

    var userTable = Parse.Object.extend("_User");
    var queryUser = new Parse.Query(userTable);

    /*Check whether the user is existed*/
    queryUser.equalTo("username", request.params.number);
    queryUser.find({
        useMasterKey: true,
        success: function(queryUserResults) {

            /*If find any record, return false*/
            if (queryUserResults.length > 0) {
                response.error("This username has already been registered");
            } else {
                /*Check validation table*/
                var validationTable = Parse.Object.extend("phoneValidationTable");
                var queryValidation = new Parse.Query(validationTable);

                /*Check whether the record is existed*/
                queryValidation.equalTo("phoneNumber", request.params.number);
                queryValidation.find({
                    success: function(queryValidationResults) {
                        if (queryValidationResults.length > 0) {
                            var validationDataObj = queryValidationResults[0];
                            /*If user had requested the SMS more than 5 times, block the user*/
                            if (validationDataObj.get("isBlocked") == true || validationDataObj.get('requestCount') >= 5) {
                                validationDataObj.set("isBlocked", true);
                                validationDataObj.save();
                                response.error("This number has been blocked by the system, please contact customer service");
                            } else {
                                /*Update the record and send the SMS*/
                                var count = validationDataObj.get('requestCount');
                                validationDataObj.set("validationCode", validationCode);
                                validationDataObj.set("requestCount", count + 1);
                                validationDataObj.save();
                                twilioSMS.sendSMS(request.params.number, validationCode, function(error, success) {
                                    if (error) {
                                        response.error(error);
                                    } else {
                                        response.success(success);
                                    }
                                });
                            }
                        } else {
                            /*Create a new record*/
                            var validationData = new validationTable();
                            validationData.set("phoneNumber", request.params.number);
                            validationData.set("validationCode", validationCode);
                            validationData.set("isValid", false);
                            validationData.set("requestCount", 1);
                            validationData.set("isBlocked", false);
                            validationData.save();
                            twilioSMS.sendSMS(request.params.number, validationCode, function(error, success) {
                                if (error) {
                                    response.error(error);
                                } else {
                                    response.success(success);
                                }
                            });
                        }
                    },
                    error: function(error) {
                        /*Unable to finish the query*/
                        winston.error("Failed to query from Validation table");
                        response.error("Failed to get validation code. Reason: failed to query in database");
                    }
                }); //find record
            }
        },
        error: function(error) {
            winston.error("Failed to query from User table");
            response.error("Failed to get validation code. Reason: failed user check" + error);
        }
    }); //find user
});


/*Validate the code*/
Parse.Cloud.define("codeValidation", function(request, response) {
    var validationTable = Parse.Object.extend("phoneValidationTable");
    var queryValidation = new Parse.Query(validationTable);

    /*Fecth the validation table*/
    queryValidation.equalTo("phoneNumber", request.params.number);
    queryValidation.find({
        success: function(queryValidationResults) {
            if (queryValidationResults.length > 0) {
                var validationDataObj = queryValidationResults[0];
                /*If the validation code is correct*/
                if (validationDataObj.get("validationCode") == request.params.code) {
                    validationDataObj.set("isValid", true);
                    validationDataObj.save();
                    response.success(true);
                } else {
                    validationDataObj.set("isValid", false);
                    validationDataObj.save();
                    response.success(false);
                }
            } else {
                /*Didn't find the number, should never reach here*/
                response.success(false);
            }
        },
        error: function(error) {
            /*Fetching failed*/
            response.error("Validation Failed, please try again later");
        }
    });
});

/*When user finish signup, delete the validation record*/
Parse.Cloud.define("deleteValidationRecord", function(request, response) {
    var validationTable = Parse.Object.extend("phoneValidationTable");
    var queryValidation = new Parse.Query(validationTable);

    /*Fecth the validation table*/
    queryValidation.equalTo("phoneNumber", request.params.number);
    queryValidation.find({
        success: function(queryValidationResults) {
            if (queryValidationResults.length > 0) {
                var validationDataObj = queryValidationResults[0];
                validationDataObj.destroy({
                    success: function(myObject) {
                        /*Successfully delete the object, return true*/
                        response.success(true);
                    },
                    error: function(myObject, error) {
                        /*Delete failed*/
                        response.error("Backend issue, please try again later");
                    }
                });
            } else {
                /*Didn't find the number, should never reach here*/
                response.success(false);
            }
        },
        error: function(error) {
            /*Fetching failed*/
            response.error("Backend issue, please try again later");
        }
    });
});

/*Get serive avaliability*/
Parse.Cloud.define("serviceRequest", function(request, response) {
    try {
        var config = require('./config');
        response.success(JSON.stringify(config.SERVICE_CONFIG));
    } catch (err) {
        response.error(err);
    }
});

/*Interface for Monitoring EC2 Data*/
Parse.Cloud.define("ec2Watch", function(request, response) {
    var accessID = request.params.accessid;
    var accessKey = request.params.accesskey;
    var instanceID = request.params.instanceid;
    var region = request.params.region;

    var config = require('./config');
    var cat = config.METRICS_EC2;

    var result = [];

    winston.info("Start EC2 Watch");
    ec2Watch.getMonitoringData(accessID, accessKey, instanceID, region, cat.metrics[0].name, cat.metrics[0].range, function(error, data) {
        if (error) {
            response.error(error);
        } else {
            result.push(data);
            ec2Watch.getMonitoringData(accessID, accessKey, instanceID, region, cat.metrics[1].name, cat.metrics[1].range, function(error, data) {
                if (error) {
                    response.error(error);
                } else {
                    result.push(data);
                    ec2Watch.getMonitoringData(accessID, accessKey, instanceID, region, cat.metrics[2].name, cat.metrics[2].range, function(error, data) {
                        if (error) {
                            response.error(error);
                        } else {
                            result.push(data);
                            ec2Watch.getMonitoringData(accessID, accessKey, instanceID, region, cat.metrics[3].name, cat.metrics[3].range, function(error, data) {
                                if (error) {
                                    response.error(error);
                                } else {
                                    result.push(data);
                                    ec2Watch.getMonitoringData(accessID, accessKey, instanceID, region, cat.metrics[4].name, cat.metrics[4].range, function(error, data) {
                                        if (error) {
                                            response.error(error);
                                        } else {
                                            result.push(data);
                                            response.success(JSON.stringify(result));
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

/*Store the access data for ec2*/
Parse.Cloud.define("ec2UserDataStore", function(request, response) {
    winston.info(request.params.accessid);

    var private_key_id = request.params.privatekeyid;
    var private_key = request.params.privatekey;
    var client_id = request.params.clientid;
    var project_id = request.params.projectid;
    var instance_id = request.params.instanceid;

    var project_id = 'test-ece496';
    var private_key_id = "1e35818b69d83e7eb4faca3bbb2deda113e10a76";
    var private_key = "-----BEGIN PRIVATE KEY-----\nMIIEwAIBADANBgkqhkiG9w0BAQEFAASCBKowggSmAgEAAoIBAQDRx5ALYhGjJlDH\nEIkI4Sc+0ZHQF34DW7K/4OJZo1Q4iZT6nAVn/4Lc+R8ynIpalt/IrLunY0AF86PO\naqFwZDcsrnet39DXuw5G+HfkLb68tk24Mg3/qUPWOhNgFTlHeX5rYnsgpQMbZ/10\nBFXDoEdTZIfFs2I5EVC8RxFLZyM+araoA67ja7pNJ/b76NAGlhyuXM5mo+2y9G3I\nc1whkVuvw8Vfs0dKM45ROnPBJ26xjw+rzGfRb+j77YSf1d9RGijpAgEpHWzzzf/M\nnUGLr8C7hODZVC+szeNrOoOrQABp96AQc4MWi7PZNFyEEsWs01H0FLx87khuhL3F\ncJ08oQc3AgMBAAECggEBAInrKTHCrRPVagAmR+HVnWa4g6QK/ecZT4DFSitirUlq\ncs786rUAELpU8wTkVDXQwZn+rnUTVJFVKFnaUv9Ac+HlZnujDXv32CAi1TfoN2F8\nfcZe6kMutpHOptRhv8HVB590JL1Gn69SBBlVjElMQ/h4vKbnE+mvD6RpGN65FTu/\n3hssyhXZ1F1+E5S4k1FhxtYPX1+ENUC3Huv1cCrsuUpADKfQhtXRrE1xNMFPt86v\ntwLtOq2IwPUwkmiIKpon3qH5Gy6R0N2Tfh7+muSzEJZE0iWvZ/fC7qbaW3F+0Wfg\nbQgVixepbjUucK54HQ2QHRmAfudUDT2LKb27AeSOU5ECgYEA8NYJd7FwMKpVLK/j\n1r7aZT7trKIcoxrTNymicoZm110V+4kx4ahbCRJQYgzrLYETDMcXDfbhOaTt4+5i\nBPZOD50AfiCxd2NqM1Tp8M3D3CWcPmWSoodcvmYP2wVMeKZ81G5AdOMVZhmc6BoV\niebsrHWvGkjIKpSlZMsK5/U99kkCgYEA3vzvUUG0Rj75c28UP8CQd6F+5F0AOzfb\noQmbGZNLVhYsxSCMBDhE0iIzv4TCnsboSld3ZtNLWOvpjrtDslG0Oi2LqXPNRyNW\niIAPzQqgRKm+r3L374evSjcNF5+0i6CasJXCsgGM+iRzOv2C15P8Vzwp94xI7iM2\nJpVOAoVBEX8CgYEAmuHbdtlrADEa08FOMlXNGB2vNj2PUym2OhyRdzuOOeSIdZqW\ntLvTx/K6NUR/nmUK/kWvQvDJiYvS3an56Z0JOKtMnNCjsNcDfn2WcaGy2wppAAvM\nkK+i6mOywLUYp+LSFr/Mvh8oLOA981qLDYOwI30PnkS+TfwIndiia+hg79kCgYEA\nyvbmzctET3waidtdTvnzhTBV035jK4OYQWgA6LKNK/pbHcKWL3EYEzxWZchtbSAX\nZzNd1xYTywhQOj5xS+naZen26XIiMtITfYMy3qsBXf4zNncq/bc+8gpRvGL9buns\nYzatVGDc9QIgcF03rwlf8fctK8lgyID8VPopW1n28/kCgYEArw49/Zp6aYo5EKFK\nKqG03G9Sh576Vt3ZOoawM10vQ+QhpbU+19jrWD1MSfWEN1dYn0Sb8zRuBebWeOij\ngXA+68p83fW/eJ00FMwuLaoSbZsNQxigH2WdEd/34lmeCUmCuaKuj1L/YlRSxl9e\nA3LwNt3jNITm9j/GTEJyFAGrb8Y=\n-----END PRIVATE KEY-----\n";
    var client_id = "102170527589653934723";
    var instance_id = "baobao";
    googleWatch.getGoogleMonitoring(private_key_id, private_key,client_id,project_id,instance_id, function(error, data) {
        if (error) {
            response.error(error);
        } else {
            response.success(JSON.stringify(data));

        }
    });
});


Parse.Cloud.define("GoogleWatch", function(request, response) {
  var privateKeyID = request.params.privatekeyid;
  var privateKey = request.params.privatekey;
  var clientID = request.params.clientid;
  var instanceID = request.params.instanceid;
  var projectID = request.params.projectid;
  googleWatch.getGoogleMonitoring(private_key_id, private_key,client_id,project_id,instance_id, function(error, data) {
      if (error) {
          response.error(error);
      } else {
          response.success(JSON.stringify(data));
      }
  });
});

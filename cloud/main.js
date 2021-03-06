var logger = require('winston');
var twilioSMS = require('./twilio/twilioSMS');

var AWSMonitor = require('./vmprovider/aws/aws_monitor');
var AWSVerfication = require('./vmprovider/aws/aws_verification');
var AWSStore = require('./vmprovider/aws/aws_store');

var googleWatch = require('./vmprovider/google/google');

/*Request SMS Validation Code*/
Parse.Cloud.define("sendCode", function(request, response) {

    logger.info("Cloud function sendCode is called");
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
                        logger.error("Failed to query from Validation table");
                        response.error("Failed to get validation code. Reason: failed to query in database");
                    }
                }); //find record
            }
        },
        error: function(error) {
            logger.error("Failed to query from User table");
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
        response.success(config.SERVICE_CONFIG);
    } catch (err) {
        response.error(err);
    }
});

/*Get serive avaliability*/
Parse.Cloud.define("ec2UserVerification", function(request, response) {
    var accessID = request.params.accessid;
    var accessKey = request.params.accesskey;
    AWSVerfication.ec2UserVerification(accessID, accessKey, function(error, info) {
        if (error) {
            response.error(error);
        } else {
            response.success(info);
        }
    });
});

/*Interface for Monitoring EC2 Data*/
Parse.Cloud.define("ec2Watch", function(request, response) {
    var accessID = request.params.accessid;
    var accessKey = request.params.accesskey;
    var instanceID = request.params.instanceid;
    var region = request.params.region;
    var metrics = request.params.metrics;
    var range = request.params.range;

    logger.info("Start EC2 Watch");
    AWSMonitor.getMonitoringData(accessID, accessKey, instanceID, region, metrics, range, function(error, data) {
        if (error) {
            response.error(error);
        } else {
            response.success(data);
        }
    });
});

/*Store the access data for ec2*/
Parse.Cloud.define("ec2UserDataStore", function(request, response) {
    var accessID = request.params.accessid;
    var accessKey = request.params.accesskey;
    var instanceid = request.params.instanceid;
    var region = request.params.region;
    var userID = request.params.userid;

    logger.info("Generating encrypted data obj");
    var storeObj = AWSStore.generateSecureStorageObject(accessID, accessKey, instanceid, region);

    Parse.Cloud.useMasterKey();
    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo("objectId", userID);

    logger.info("Start querying user");
    userQuery.find({
        success: function(queryUserResults) {
            if (queryUserResults.length > 0) {
                var user = queryUserResults[0];
                logger.info("User found with nickname: " + user.get("nickname"));
                var credentialStorageTable = Parse.Object.extend("CredentialStorageTable");
                var queryCredential = new Parse.Query(credentialStorageTable);

                queryCredential.equalTo("userid", userID);
                queryCredential.find({
                    success: function(queryCredentialResults) {
                        var isContain = false;
                        for (var i = 0; i < queryCredentialResults.length; i++) {
                            var record = queryCredentialResults[i];
                            var obj = AWSStore.decryptDataObject(record.get("data"));
                            if (obj.ai == accessID && obj.ak == accessKey && obj.ii == instanceid && obj.re == region) {
                                response.error("Account already existed, please check your profile.");
                            }
                        }

                        var credentialData = new credentialStorageTable();
                        credentialData.set("userid", userID);
                        credentialData.set("data", JSON.stringify(storeObj));
                        credentialData.save();
                        response.success("Credetial Store Succeed");
                        // if (isContain == false) {
                        //     var credentialData = new credentialStorageTable();
                        //     credentialData.set("userid", userID);
                        //     credentialData.set("data", JSON.stringify(storeObj));
                        //     credentialData.save();
                        //     response.success("Credetial Store Succeed");
                        // } else {
                        //     response.error("Account already existed, please check your profile.");
                        // }
                    },
                    error: function(error) {
                        logger.error("Failed to execute query");
                        response.error("Validation Failed, please try again later");
                    }
                }); //find record
            }
        },
        error: function(error) {
            /*Fetching failed*/
            response.error("Validation Failed, please try again later");
        }
    });
});

Parse.Cloud.define("ec2UserDataGet", function(request, response) {
    var userID = request.params.userid;

    var credentialStorageTable = Parse.Object.extend("CredentialStorageTable");
    var queryCredential = new Parse.Query(credentialStorageTable);

    queryCredential.equalTo("userid", userID);
    queryCredential.find({
        success: function(queryCredentialResults) {
            logger.info("Data get success");
            var result = [];
            for (var i = 0; i < queryCredentialResults.length; i++) {
                var record = queryCredentialResults[i];
                var obj = AWSStore.decryptDataObject(record.get("data"));
                result.push(obj);
            }
            response.success(result);
        },
        error: function(error) {
            logger.error("Failed to execute query");
            response.error("Validation Failed, please try again later");
        }
    }); //find record

});

/*When user finish signup, delete the validation record*/
Parse.Cloud.define("deleteEC2CredentialRecord", function(request, response) {
    var accessID = request.params.accessid;
    var accessKey = request.params.accesskey;
    var instanceid = request.params.instanceid;
    var region = request.params.region;
    var userID = request.params.userid;

    logger.info("Generating encrypted data obj");
    var storeObj = AWSStore.generateSecureStorageObject(accessID, accessKey, instanceid, region);

    Parse.Cloud.useMasterKey();
    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo("objectId", userID);

    logger.info("Start querying user");
    userQuery.find({
        success: function(queryUserResults) {
            if (queryUserResults.length > 0) {
                var user = queryUserResults[0];
                logger.info("User found with nickname: " + user.get("nickname"));
                var credentialStorageTable = Parse.Object.extend("CredentialStorageTable");
                var queryCredential = new Parse.Query(credentialStorageTable);

                queryCredential.equalTo("userid", userID);
                queryCredential.find({
                    success: function(queryCredentialResults) {
                        var isContain = false;
                        for (var i = 0; i < queryCredentialResults.length; i++) {
                            var record = queryCredentialResults[i];
                            var obj = AWSStore.decryptDataObject(record.get("data"));

                            if (obj.ai == accessID && obj.ak == accessKey && obj.ii == instanceid && obj.re == region) {
                                record.destroy({
                                    success: function(myObject) {
                                        /*Successfully delete the object, return true*/
                                        response.success("Record successfully deleted");
                                    },
                                    error: function(myObject, error) {
                                        /*Delete failed*/
                                        response.error("Backend issue, please try again later");
                                    }
                                });
                            }
                        }
                        response.error("Did not find record");
                    },
                    error: function(error) {
                        logger.error("Failed to execute query");
                        response.error("Validation Failed, please try again later");
                    }
                }); //find record
            }
        },
        error: function(error) {
            /*Fetching failed*/
            response.error("Validation Failed, please try again later");
        }
    });
});

Parse.Cloud.define("GoogleWatch", function(request, response) {
    var privateKeyID = request.params.privatekeyid;
    var privateKey = request.params.privatekey;
    var clientID = request.params.clientid;
    var clientEmail = request.params.clientemail;
    var instanceID = request.params.instanceid;
    var projectID = request.params.projectid;
    var newprivateKey = privateKey.replace(/\\n/g, "\n");
    googleWatch.getGoogleMonitoring(privateKeyID, newprivateKey, clientID, clientEmail, projectID, instanceID, function(error, data) {
        if (error) {
            response.error(error);
        } else {
            response.success(data);
        }
    });
});

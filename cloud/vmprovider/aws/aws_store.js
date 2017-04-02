var logger = require('winston');
var encryption = require('../../encryption/encryption');

module.exports = {
    generateSecureStorageObject: function(accessID, accessKey, instanceid, region) {
        logger.info("Processing Encryption");
        var dataKey = encryption.generateAESKey();
        var accessIDEncrypted = encryption.encrypt(accessID, dataKey);
        var accessKeyEncrypted = encryption.encrypt(accessKey, dataKey);
        var instanceIdEncrypted = encryption.encrypt(instanceid, dataKey);
        var regionEncrypted = encryption.encrypt(region, dataKey);
        var dataKeyEncrypted = encryption.encrypt(dataKey, process.env.DB_ENCRYPTION_MASTER_KEY);

        return {
            "dk": dataKeyEncrypted,
            "ai": accessIDEncrypted,
            "ak": accessKeyEncrypted,
            "ii": instanceIdEncrypted,
            "re": regionEncrypted
        };
    },

    decryptDataObject: function(data) {
        // var credential = JSON.parse(obj);
        var credential = JSON.parse(data);
        logger.info("Processing Decryption");
        var dataKey = encryption.decrypt(credential["dk"], process.env.DB_ENCRYPTION_MASTER_KEY);
        var accessID = encryption.decrypt(credential["ai"], dataKey);
        var accessKey = encryption.decrypt(credential["ak"], dataKey);
        var instanceID = encryption.decrypt(credential["ii"], dataKey);
        var region = encryption.decrypt(credential["re"], dataKey);

        return {
            "ai": accessID,
            "ak": accessKey,
            "ii": instanceID,
            "re": region
        }
    }
};

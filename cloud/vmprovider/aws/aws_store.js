var logger = require('winston');
var encryption = require('../../encryption/encryption');

module.exports = {
    generateSecureStorageObject: function(accessID, accessKey) {
        logger.info("Processing Encryption");
        var dataKey = encryption.generateAESKey();
        var accessIDEncrypted = encryption.encrypt(accessID, dataKey);
        var accessKeyEncrypted = encryption.encrypt(accessKey, dataKey);
        var dataKeyEncrypted = encryption.encrypt(dataKey, process.env.DB_ENCRYPTION_MASTER_KEY);

        return {
            "dk": dataKeyEncrypted,
            "ai": accessIDEncrypted,
            "ak": accessKeyEncrypted
        };
    },
    decryptDataObject: function(data) {
        var credential = JSON.parse(obj);
        logger.info("Processing Decryption");
        var dataKey = encryption.decrypt(credential["dk"], process.env.DB_ENCRYPTION_MASTER_KEY);
        var accessID = encryption.decrypt(credential["ai"], dataKey);
        var accessKey = encryption.decrypt(credential["ak"], dataKey);

        return {
            "dk": dataKey,
            "ai": accessID,
            "ak": accessKey
        }
    }
};

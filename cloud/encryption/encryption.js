var crypto = require('crypto');

module.exports = {
    generateAESKey: function() {
        var salt = crypto.randomBytes(32);
        var passphrase = crypto.randomBytes(48).toString('hex');
        var iterations = 267;
        var keyByteLength = 32;

        const key = crypto.pbkdf2Sync(passphrase, salt, iterations, keyByteLength, 'sha256');
        return key.toString('hex');

        // crypto.randomBytes(48, function(err, buffer) {
        //     if (err == null) {
        //         var passphrase = buffer.toString('hex');
        //         // crypto.pbkdf2(passphrase, salt, iterations, keyByteLength, 'sha256', function(err, bytes) {
        //         //     if (err == null) {
        //         //         return bytes.toString('hex');
        //         //     }
        //         // });
        //
        //     }
        // });
        // return null;
    },
    encrypt: function(text, key) {
        var cipher = crypto.createCipher(process.env.DB_ENCRYPTION_ALGORITHM, key);
        var crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    },
    decrypt: function(text, key) {
        var decipher = crypto.createDecipher(process.env.DB_ENCRYPTION_ALGORITHM, key);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
};

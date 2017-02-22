// var CryptoJS = require("crypto-js");
var crypto = require('crypto');
var winston = require('winston');

module.exports = {
    // requestMasterKey: function() {
    //     winston.info("Requesting master key");
    //
    //     var passphrase = process.env.PASSPHRASE;
    //     // random on a per-user basis
    //     var salt = crypto.randomBytes(32);
    //
    //     // keep it well under 10,000
    //     var iterations = 267;
    //
    //     var keyByteLength = 32; // desired length for an AES key
    //
    //     crypto.pbkdf2(passphrase, salt, iterations, keyByteLength, 'sha256', function(err, bytes) {
    //         console.log(bytes.toString('hex'));
    //     });
    // },
    encrypt: function(text) {
        var cipher = crypto.createCipher(process.env.DB_ENCRYPTION_ALGORITHM, process.env.DB_ENCRYPTION_MASTER_KEY)
        var crypted = cipher.update(text, 'utf8', 'hex')
        crypted += cipher.final('hex');
        return crypted;
    },
    decrypt: function(text) {
        var decipher = crypto.createDecipher(process.env.DB_ENCRYPTION_ALGORITHM, process.env.DB_ENCRYPTION_MASTER_KEY)
        var dec = decipher.update(text, 'hex', 'utf8')
        dec += decipher.final('utf8');
        return dec;
    }
};
// var hw = encrypt("hello world")
// // outputs hello world
// console.log(decrypt(hw));

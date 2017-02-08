var CryptoJS = require("crypto-js");

module.exports = {
    requestMasterKey: function() {
        winston.info("Requesting master key");

        var passphrase = process.env.PASSPHRASE;
        // random on a per-user basis
        var salt = crypto.randomBytes(32);

        // keep it well under 10,000
        var iterations = 267;

        var keyByteLength = 32; // desired length for an AES key

        crypto.pbkdf2(passphrase, salt, iterations, keyByteLength, 'sha256', function(err, bytes) {
            console.log(bytes.toString('hex'));
        });
    },
    encrypt: function() {
        winston.info("Proceeding encryption");
        var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123');
    },
    decrypt: function() {
        winston.info("Precessing Decryption");
        // Decrypt
        var bytes = CryptoJS.AES.decrypt(ciphertext.toString(), 'secret key 123');
        var plaintext = bytes.toString(CryptoJS.enc.Utf8);
    }
};

var CryptoJS = require("crypto-js");
var passphrase = process.env.PASSPHRASE;

// it is not necessary that this be private, just random on a per-user basis
var salt = crypto.randomBytes(32);

// you want this to slow down an attacker, but not yourself or a user
// if you use mobile devices or hobby hardware, keep it well under 10,000
// it is not necessary that this be private
var iterations = 267;

var keyByteLength = 32; // desired length for an AES key

crypto.pbkdf2(passphrase, salt, iterations, keyByteLength, 'sha256', function (err, bytes) {
    console.log(bytes.toString('hex'));
});


// Encrypt
var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123');

// Decrypt
var bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), 'secret key 123');
var plaintext = bytes.toString(CryptoJS.enc.Utf8);

console.log(plaintext);

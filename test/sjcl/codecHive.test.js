new sjcl.test.TestCase("hive signature test vectors", function(cb) {

  var hash = sjcl.hash.sha256.hash([]);
  var self = this;

  sjcl.test.vector.hivesig.forEach(function(fixture) {
  
    var secretKey = sjcl.codec.hive.deserializePrivateKey(fixture.secretKey);
    var publicKey = sjcl.codec.hive.deserializePublicKey(fixture.publicKey);

    fixture.signatures.forEach(function(signature) {
      var k = new sjcl.bn(signature.k);
      var r = new sjcl.bn(signature.r);
      var s = new sjcl.bn(signature.s);

      var sig = sjcl.bitArray.concat(r.toBits(256), s.toBits(256));
      publicKey.verify(hash, sig);

      var generatedSig = sjcl.codec.hive.signRecoverably(secretKey, hash, 0, k);

      var recoveredPublicKey = sjcl.codec.hive.recoverPublicKey(hash, generatedSig);

      publicKey.verify(hash, sjcl.bitArray.bitSlice(generatedSig, 8));

      self.require(
        fixture.publicKey === sjcl.codec.hive.serializePublicKey(recoveredPublicKey),
        'our recovered public key is the right one'
      );

    });
    
  });

  cb();
});


new sjcl.test.TestCase("hive signature core functionality", function(cb) {
   
  var keys = {
    sec: sjcl.codec.hive.deserializePrivateKey("5JamTPvZyQsHf8c2pbN92F1gUY3sJkpW3ZJFzdmfbAJPAXT5aw3"),
    pub: sjcl.codec.hive.deserializePublicKey("STM5SKxjN1YdrFLgoPcp9KteUmNVdgE8DpTPC9sF6jbjVqP9d2Utq")
  };
 
  var fakehash = sjcl.hash.sha256.hash([1]);
  var sig = sjcl.codec.hive.signRecoverably(keys.sec, fakehash, 0, new sjcl.bn(19));
  this.require(
    keys.pub.verify(fakehash, sjcl.bitArray.bitSlice(sig, 8)),
    'signature passes verification'
  );

  cb();
});

new sjcl.test.TestCase("hive key codec tests", function (cb) {
 
  var testValues = [{
    username: "username",
    password: "password",
    role: "active",
    sec: "5JamTPvZyQsHf8c2pbN92F1gUY3sJkpW3ZJFzdmfbAJPAXT5aw3",
    pub: "STM5SKxjN1YdrFLgoPcp9KteUmNVdgE8DpTPC9sF6jbjVqP9d2Utq"
  }];

  for (var i = 0; i < testValues.length; i++) {
    var testValue = testValues[i];

    var keys = sjcl.codec.hive.keysFromPassword(
      testValue.username,
      testValue.password
    );

    var serializedSec = sjcl.codec.hive.serializePrivateKey(keys[testValue.role].sec);
    var serializedPub = sjcl.codec.hive.serializePublicKey(keys[testValue.role].pub);

    this.require(testValue.sec == serializedSec, 'secret key: generated ' + serializedSec + ', expected ' + testValue.sec);
    this.require(testValue.pub == serializedPub, 'public key: generated ' + serializedPub + ', expected ' + testValue.pub);
  
    // on deserialization we should expect to recover both points of the public key
    var deserializedPublicKey = sjcl.codec.hive.deserializePublicKey(serializedPub);
    this.require(
      sjcl.bitArray.equal(
        deserializedPublicKey.get().x,
        keys[testValue.role].pub.get().x
      ),
      "X values of original and deserialized public keys are identical"
    );
     this.require(
      sjcl.bitArray.equal(
        deserializedPublicKey.get().y,
        keys[testValue.role].pub.get().y
      ),
      "Y values of original and deserialized public keys are identical"
    );

    // on deserialization the secret key should be the same
    var deserializedPrivateKey = sjcl.codec.steemit.deserializePrivateKey(serializedSec);
    this.require(
      sjcl.bitArray.equal(
        deserializedPrivateKey.get(),
        keys[testValue.role].sec.get()
      ),
      "original and deserialized secret keys are identical"
    );

  }
  
  cb();
});

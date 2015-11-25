var express = require('express');
var request = require('request');
var cors = require('cors');
var FirebaseTokenGenerator = require('firebase-token-generator');
var app = express();

module.exports = function(config) {
  var tokenGenerator = new FirebaseTokenGenerator(config.firebase_secrect);
   
  app.use(cors());
   
  app.get('/', function(req, res, next){
    var token = req.query.id_token;
    request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + token, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        //valid token
        var tokenInfo = JSON.parse(body);
        //check whether aud contains clientid and hd, if provided, matches configured hd
        if (tokenInfo.aud.indexOf(config.client_id) > -1 && (!config.hd || tokenInfo.hd === config.hd)) {
          var firebaseTokenInfo = {
            provider: 'google',
            uid: 'google:' + tokenInfo.sub,
            email: tokenInfo.email,
            given_name: tokenInfo.given_name,
            family_name: tokenInfo.family_name
          };
          var firebaseToken = tokenGenerator.createToken(firebaseTokenInfo);
          res.json({valid: true, token: firebaseToken});
        } else {
          res.json({valid: false});
        }
      } else {
        res.json({valid: false});
      }
    });
  });

  return app;
};

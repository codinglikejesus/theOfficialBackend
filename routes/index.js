var express = require('express');
require('dotenv').config();
var http = require('http');
var https = require('https');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node');

var app = require('../app');
var longpoll = require('express-longpoll') (app, {
  DEBUG : true
});

var scopes = ['user-read-private', 'user-read-email'];

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  redirectUri: 'http://localhost:3000/redirect'
});

var state;

longpoll.create('/poll/:id', (req,res,next) => {
  req.id = req.params.id;
  next();
});

router.get('/me', function(req,res,next){
  state = req.query.state;
  var authorizeurl = spotifyApi.createAuthorizeURL(scopes, state);
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8100')
  res.json({"url": authorizeurl});


})

router.get('/redirect', (req,res,next) => {
  var code = req.query.code; 
  spotifyApi.authorizationCodeGrant(code).then(
    (data) => {
      console.log('The token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
      console.log('The refresh token is ' + data.body['refresh_token']); 
      
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      

      longpoll.publishToId("poll/:id", state, data);

      res.status(200).send();
    },
    (err) => {
      console.log(err);
    }
  )
})
module.exports = router;

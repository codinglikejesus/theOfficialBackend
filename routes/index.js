var express = require('express');
require('dotenv').config();
var router = express.Router();
var axios = require('axios');

var longpoll = require('express-longpoll')(router);

const querystring = require('querystring');
const {base64encode, base64decode} = require('nodejs-base64');

var SpotifyWebApi = require('spotify-web-api-node');

var scopes = ['user-read-private', 'user-read-email'];

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/redirect'
});

var state;


router.get('/me', function(req,res,next){
  state = req.query.state;
  longpoll.create("/poll/:id", (req,res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.id = req.params.id;
    next();
  });
  var authorizeurl = spotifyApi.createAuthorizeURL(scopes, state);

  res.json({"url": authorizeurl});


});
router.post('/refresh', (req,res,next) => {
  var config = {
    'headers':{
      'Authorization':'Basic '+base64encode(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)
    }
  }
  axios.post('https://accounts.spotify.com/api/token',
  querystring.stringify(
    {
      'grant_type':"refresh_token",
      'refresh_token':req.body.refresh_token
    }),
    config
  )
  .then((response) => {
    console.log(res.data);
    res.json(response.data);
  }).catch((err) => {
    console.log(err.response.data);
    console.log(err.response.status);
    console.log(err.response.headers);
    res.status(400).send(err);
  })
});

router.get('/redirect', (req,res,next) => {
  var code = req.query.code; 
  
  var config = {
    'headers':{
      'Authorization':'Basic '+base64encode(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)
    }
  }
  axios.post('https://accounts.spotify.com/api/token',
    querystring.stringify(
     {
      'grant_type':"authorization_code",
      'code':code,
      'redirect_uri':'http://localhost:3000/redirect',
    }),
    config
  ).
  then((res) => {

    console.log(state);
    longpoll.publishToId("/poll/:id", state, res.data)

  }).catch((err) => {
    console.log(err);
  });
  res.status(400).end();

});
  /*
  spotifyApi.authorizationCodeGrant(code).then(
    (data) => {
      console.log('The token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
      console.log('The refresh token is ' + data.body['refresh_token']); 
      
      tokens.push(
        {
          'state':state,
          'token':data
        }
      );
      
      res.status(200).send();
    },
    (err) => {
      console.log(err);
    }
  )
  */

/*
router.get('/poll/:id', (req,res,next) => {
  for(var i = 0; i < tokens.length; i++){
    if(tokens[i].state === req.params.id ){
      console.log(tokens[i]);
      res.set({'Access-Control-Allow-Origin' : 'http://localhost:8100',
               'content-type' : 'application/json'});
      res.send(tokens[i]);
    }
 
    else if(i == tokens.length -1){
      await sleep(2000);
      i = 0;
   
  }
  res.sendStatus(404);
  })
*/


function sleep(ms){
  return new Promise(resolve =>{
    setTimeout(resolve,ms);
  }).catch((err) => {
    console.log(err);
  })
}
module.exports = router;

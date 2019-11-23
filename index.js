var querystring = require('querystring');
const axios = require('axios');
const WebSocket = require('ws');

var username = 'CLIENT_ID';
var password = 'API_KEY';
var url = 'https://dlive.tv/o/token';
var graphUrl = 'https://graphigo.prd.dlive.tv/'
const wsUrl = 'wss://api-ws.dlive.tv'
const query = "subscription{streamMessageReceived(streamer:\"channelname\"){__typename}}"

var connectSocket = function(authKey){
    const ws = new WebSocket(wsUrl, 'graphql-ws');
      
    ws.on('open', function open() {
        console.info('[WS] Connected!')
        ws.send(JSON.stringify({
            "type": "connection_init",
            "payload": {
                "authorization" : authKey
            }
        }));
        ws.send(JSON.stringify({
            "id":"100",
            "type":"start",
            "payload":{
                "query": query
            }
        }));

        ws.on('message', function incoming(data) {
            var streamMessage = JSON.parse(data)
            if(streamMessage['payload']){
                const streamEventData = streamMessage['payload']['data']['streamMessageReceived'][0]
                switch(streamEventData['type']){
                    case 'Message':
                        console.info(streamEventData['content'])
                    break;
                    case 'Live':
                        getStreamerGame()
                    break;
                }
            }
            console.info(data);
          });

        ws.on('close', function close() {
            getAuthToken()
            console.log('[WS] disconnected');
        });
          
    });

}

var getAuthToken = function() {
    axios.post(url, querystring.stringify({grant_type: 'client_credentials'}),{
        auth: {
            username: username,
            password: password
        }
    }).then(function(response) {
        console.info('Got access key.')
        connectSocket(response['data']['access_token'])
    }).catch(function(error) {
        console.info('Error on Authentication', error);
    });
}

var getStreamerGame = function() {
    axios.post(graphUrl, {
        query: `query{
            user(username:"channelname") {
                displayname
                avatar
                partnerStatus,
                livestream {
                    title,
                    category {
                        title
                    }
                }
                
            }
        }`
    },{
        headers: {
          'Content-Type': 'application/json'
        }
    }).then(function(response) {
        if (response['data']['data']['user']['livestream']['category']['title']){
            console.info('MM is live now!')
            console.info(response['data']['data']['user']['livestream']['category']['title'])
        }
        return null;
    }).catch(function(error) {
        console.info('Error on Game', error);
    });
}

getAuthToken()


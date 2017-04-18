var express = require("express");
var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var request = require("request");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));

// In the Twilio dashboard, the incoming message Webhook points to https://wnd-go-twilio.glitch.me/sms
// When this URL is hit, this function is run
app.post("/sms", function(req, responseText) {
  
  // startOfString contains the all incoming text before the first underscore
  var startOfString = req.body.Body.split("_")[0];
  
  // We are using the value of startOfString to determine whether the user is texting something random (and is a new player)
  // If the string starts with "wnd_" or "@wnd", we can assume they're following an earlier request to type a handle
  var startingPlayer = startOfString !== "wnd" && startOfString !== "@wnd" ? true : false;
  
  // If the player is not new, we set userText to their text
  // If they are new, we'll set it to "wnd_go"
  var userText = !startingPlayer ? req.body.Body : "wnd_go";
    
  // Make a request to grab the entire contents of the twitter page of the value of userText
  request("http://twitter.com/" + userText, function(err, res, body) {
    
    // Load contents into Cheerio so we can easily search through it
    $ = cheerio.load(body);
    
    // Grab the first tweet item in the stream     
    var firstItem = $("ol.stream-items").children().first();
    
    // Grab the text content of the first tweet item
    var tweetContent = firstItem.find(".tweet-text").text();
    
    // If the player is new, add instructions to the start of the message
    if(startingPlayer) tweetContent = "Welcome to the adventure. Respond with 'wnd_run' or 'wnd_hide' to continue \n\n" + tweetContent;
    
    // Construct and send TwiML
    responseText.send("<Response><Message>" + tweetContent + "</Message></Response>");
  });
});


var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
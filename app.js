var express = require('express')
var Sentiment = require('sentiment')

var { getMenu } = require('./get_menu.js')
var { rank } = require('./rank.js')

const client_id = "VCRNKCHGA1ZH4ALEJ5TEZPGPUXVKWVPICA1M0J2KF5IBMJ33"
const client_secret = "GPVYWMMB41WF4VM2JGPK030PXUTCQDHGJEIO30TYATWMV2IF"
var lat = "33.416178808321426"
var lon = "-111.872781158"
var restaurant_name = "Starbucks"

var app = express();

app.get('/', async function (req, res) {
	// Get restaurant menu
	var menu = await getMenu(client_id, client_secret, restaurant_name, lat, lon)

	// Analyze sentiment of reviews
	var sentiment = new Sentiment()
	// for review in reviews
	// var result = sentiment.analyze(review)

	res.send(menu);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
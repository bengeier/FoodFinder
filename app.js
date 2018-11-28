var express = require('express');
var bodyParser = require('body-parser');
var Sentiment = require('sentiment');

var { getMenu } = require('./get_menu.js');
var { rank } = require('./rank.js');

// Hardcoded values for restaurant
const client_id = "VCRNKCHGA1ZH4ALEJ5TEZPGPUXVKWVPICA1M0J2KF5IBMJ33"
const client_secret = "GPVYWMMB41WF4VM2JGPK030PXUTCQDHGJEIO30TYATWMV2IF"
var lat = "35.9980797"
var lon = "-115.2066921"
var restaurant_name = "Starbucks"


var app = express();
// Set view engine/template to use pug
app.set("view engine", "pug");
// Get static content from public folder
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 


// Home page to ask user for input
app.route('/')
	.get(function (req, res) {
		res.render('home');
	})
// Post form data from user input
	.post(function (req, res) {
		var name = encodeURIComponent(req.body.name);
		// might not need to encode when passing thru api or something
		var address = req.body.address//encodeURIComponent(req.body.address);

		console.log(name)
		console.log(address)

		// Convert address to latitude and longitude
		var lat = 0;
		var lon = 0;

		// Pass parameters in query string to result to use for computation
		//res.redirect("/results?restaurant_name=" + name + "&lat=" + lat + "&lon=" + lon);
	})

// Search results page
app.get('/results', async function (req, res) {
	// Get query variables from url
	var restaurant_name1 = req.query.restaurant_name;
	var lat1 = req.query.lat;
	var lon1 = req.query.lon;
	console.log(restaurant_name1)
	console.log(lat1)
	console.log(lon1)

	// Get restaurant menu
	var menu = await getMenu(client_id, client_secret, restaurant_name, lat, lon)

	// Analyze sentiment of reviews
	var sentiment = new Sentiment()
	// for review in reviews
	// var result = sentiment.analyze(review)

	// Rank results -- results is object with key is menu item and value is
	// sum score/# pos. reviews -- e.g. "chicken pasta": 15.2
	// var sorted_results = rank(results)

	// render pug page
	res.render('results', { menu: menu.toString() });
});

app.listen(3000, function () {
  console.log('App listening on port 3000!');
});
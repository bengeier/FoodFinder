var express = require('express');
var bodyParser = require('body-parser');
var Sentiment = require('sentiment');
var NodeGeocoder = require('node-geocoder');

// Imported functions
var { getMenu } = require('./get_menu.js');
var { rank } = require('./rank.js');
var { getReviews } = require('./get_reviews.js');

// Foursquare API keys
const client_id = "VCRNKCHGA1ZH4ALEJ5TEZPGPUXVKWVPICA1M0J2KF5IBMJ33"
const client_secret = "GPVYWMMB41WF4VM2JGPK030PXUTCQDHGJEIO30TYATWMV2IF"

// Boilerplate to set up express and frontend
var app = express();
app.set("view engine", "pug");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 


// Home page to ask user for input
app.route('/')
	.get(function (req, res) {
		res.render('home');
	})
// Post form data from user input
	.post(async function (req, res) {
		var name = encodeURIComponent(req.body.name);
		var address = req.body.address//encodeURIComponent(req.body.address);

		// geocode address to get lat/long
		var options = {
			provider: 'google',
			apiKey: 'AIzaSyCUa4aaF8rImF_2WE3A6gnlaz_0YTMN3t8'
		};
		var geocoder = NodeGeocoder(options);
		try {
			var results = await geocoder.geocode(address)
			var lat = results[0].latitude;
			var lon = results[0].longitude;

			// Pass parameters in query string to result to use for computation
			res.redirect("/results?restaurant_name=" + name + "&lat=" + lat + "&lon=" + lon);
		} catch (error) {
			// if any error then redirect to home page
			console.log(error.message);
			res.redirect("/");
		}
	})

// Search results page
app.get('/results', async function (req, res) {
	// Get query variables from url
	var restaurant_name = req.query.restaurant_name;
	var lat = req.query.lat;
	var lon = req.query.lon;

	// Get restaurant menu
	console.log("menu")
	var menu = await getMenu(client_id, client_secret, restaurant_name, lat, lon)

	// If not valid restaurant and location then error
	if (menu instanceof Error) {
		res.send(menu.message + "\nInvalid restaurant and/or address. Please retry.")
		return
	}

	// Get restaurant reviews
	var reviews = await getReviews(restaurant_name)

	// If not valid restaurant and location then error
	if (reviews instanceof Error) {
		res.send(reviews.message + "\nInvalid restaurant and/or address. Please retry.")
		return
	}

	// Parse dish names out of reviews

	// Analyze sentiment of reviews
	var sentiment = new Sentiment()
	// for review in reviews
	// var result = sentiment.analyze(review)

	// Rank results -- results is object with key is menu item and value is
	// sum score/# pos. reviews -- e.g. "chicken pasta": 15.2
	// var sorted_results = rank(results)

	// render pug page
	console.log("render")
	res.render('results', { menu: menu.toString() });
});

app.listen(3000, function () {
  console.log('App listening on port 3000!');
});
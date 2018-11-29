var express = require('express');
var bodyParser = require('body-parser');
var Sentiment = require('sentiment');
var NodeGeocoder = require('node-geocoder');
var keyword_extractor = require('keyword-extractor');
var fuzz = require('fuzzball')

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

	// Parse dish names out of reviews and analyze sentiment of review
	var sentiment = new Sentiment()
	var rated_items = {}
	for (var i = 0; i < reviews.length; i++) {
		var rev = reviews[i]
		var extract_result = keyword_extractor.extract(rev, {
			language: "english",
			remove_digits: false,
			return_changed_case: false,
			return_chained_words: true,
			remove_duplicates: false
		})

		// Perform string matching on all results to find any matches with menu items
		var options = {
			scorer: fuzz.token_sort_ratio,
			cutoff: 75
		}
		for (var j = 0; j < extract_result.length; j++) {
			var query = extract_result[j]
			var match_results = fuzz.extract(query, menu, options)

			if (match_results.length > 0) {
				// Sentiment analysis of review
				var sent_result = sentiment.analyze(rev)

				// Add score to item ratings
				for (var k = 0; k < match_results.length; k++) {
					if (!rated_items[match_results[k][0]]) {
						rated_items[match_results[k][0]] = 0
					}

					rated_items[match_results[k][0]] += sent_result.score
				}
			}
		}
	}

	// Rank results -- results is object with key is menu item and value is
	// sum score/# pos. reviews -- e.g. "chicken pasta": 15.2
	var sorted_results = rank(rated_items)

	// render pug page
	res.render('results', { restaurant_name: restaurant_name, results: sorted_results });
});

app.listen(3000, function () {
  console.log('App listening on port 3000!');
});
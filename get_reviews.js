const fs = require('fs')

var business_stream = fs.createReadStream("./data/parsed_business.json", {flags: "r", encoding: "utf-8"})
var buf = ""
var checking_review = false
var business_list = []
var review_list = []

// Get given restaurant's reviews from file
function getReviews(restaurant_name) {
	// Replace ' with \'
	var name = restaurant_name.replace(/'/g, "\'")

	return new Promise((resolve, reject) => {
		// Do line by line checking on businesses
		business_stream.on("data", data => {
			// stash data read into string buffer
			buf += data.toString() 
			// then process data
			pump()
		})

		// Move on to review stream when business stream done
		business_stream.on("end", () => {
			// if restaurant not in given data
			if(!business_list.includes(name)) {
				resolve(new Error("Restaurant is invalid or not in the given dataset"))
			}

			// else the restaurant is in given data
			var filename = "./data/reviews/" + restaurant_name.replace("/", " ") + ".json"
			var review_stream = fs.createReadStream(filename, {flags: "r", encoding: "utf-8"})
			buf = ""
			checking_review = true

			review_stream.on("data", data => {
				// stash data read into string buffer
				buf += data.toString()
				// then process data
				pump()
			})

			
			review_stream.on("end", () => {
				resolve(review_list)
			})
		})
	})
}

// Process buffer with new line
function pump() {
	var pos

	// keep going while there is new line
	while ((pos = buf.indexOf("\n")) >= 0) {
		// if more than one newline then buffer will start with newline
		if (pos == 0) {
			buf = buf.slice(1)
			continue
		}

		//hand off line of data
		processLine(buf.slice(0, pos))
		//slice processed data off buffer
		buf = buf.slice(pos + 1)
	}
}

// Check individual line corresponding to a single business
function processLine(line) {
	// Discard CR (0x0D)
	if (line[line.length - 1] == "\r") {
		line = line.substr(0, line.length - 1)
	}

	// Make sure line isn't empty
	if (line.length > 0) {
		try {
			var obj = JSON.parse(line)

			if (!checking_review) {
				// Add business name to list of businesses
				business_list.push(obj.name)
			} else if (checking_review) {
				// Add review to list of reviews
				review_list.push(obj.text)
			}
		} catch (error) {
			// ignore any reviews that cannot be parsed
		}
	}
}

module.exports = {
	getReviews
}
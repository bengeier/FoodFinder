// Want business_id, name, latitude, longitude, categories contains restaurants
// Want business_id, stars, text

var fs = require("fs")

var write_business = fs.createWriteStream("parsed_business.json", {flags: "a"})
var write_review = fs.createWriteStream("parsed_reviews.json", {flags: "a"})
var business_stream = fs.createReadStream("./yelp_academic_dataset_business.json", {flags: "r", encoding: "utf-8"})
var buf = ""
var business_ids = []
var checking_review = false

// Do line by line checking on businesses
business_stream.on("data", data => {
	// stash data read into string buffer
	buf += data.toString() 
	// then process data
	pump()
})

// Move on to review stream when business stream done
business_stream.on("end", () => {
	var review_stream = fs.createReadStream("./yelp_academic_dataset_review.json", {flags: "r", encoding: "utf-8"})
	buf = ""
	checking_review = true
	console.log("Finished parsing business data")

	review_stream.on("data", data => {
		// stash data read into string buffer
		buf += data.toString()
		// then process data
		pump()
	})
})

// Process buffer
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
		var obj = JSON.parse(line)

		// Only look at restaurants from businesses
		if (!checking_review && obj.categories != null && obj.categories.includes("Restaurants")) {
			// Add to business id array for use for reviews
			business_ids.push(obj.business_id)

			// Create json object of fields we need to write to new json file
			var name = obj.name.replace(/"/g, '\\"')		// parse any double quotes
			var parsed_json = `{"business_id":"${obj.business_id}","name":"${name}","latitude":${obj.latitude},"longitude":${obj.longitude}}`
	
			// write to new file
			write_business.write(parsed_json + "\n")
		} else if (checking_review && business_ids.includes(obj.business_id)) {
			// Only look at reviews that are about restaurants we processed
			var text = obj.text.replace(/"/g, '\\"')
			var parsed_json = `{"business_id":"${obj.business_id}","text":"${text}"}`
			// write to new file
			write_review.write(parsed_json + "\n")
		}
	}
}
// Want to separate reviews into their own files based on restaurant name

var fs = require('fs')

var business_stream = fs.createReadStream("./parsed_business.json", {flags: "r", encoding: "utf-8"})
var buf = ""
var checking_review = false
// Map for restaurant id to restaurant name
var business_map = {}

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
		var obj = JSON.parse(line)

		if (!checking_review) {
			// Parse businesses into map with key as id and value as name
			business_map[obj.business_id] = obj.name
		} else if (checking_review && business_map[obj.business_id]) {
			// Find restaurant that the review is about and add the review
			// to data file corresponding the the restaurant if the review is
			// about a valid restaurant
			var text = obj.text.replace(/"/g, '\\"')
			text = text.replace(/\n/g, " ")	// replace new lines with space so reviews all 1 line
			var parsed_json = `{"text":"${text}"}`

			// write to new file
			var name = business_map[obj.business_id].replace("/", " ")	// can't have / in file name
			var filename = "./reviews/" + name + ".json"
			var write_review = fs.createWriteStream(filename, {flags: "a"})
			write_review.write(parsed_json + "\n")
			write_review.end()
		}
	}
}
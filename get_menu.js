const request = require("request-promise")

/** Example to test
 * "name":"Starbucks","latitude":33.4165848044,"longitude":-111.872781158
 * "name": "Wendy's", "latitude":40.2634088,"longitude":-80.1738737
 */

// Get restaurant menu given name, latitude, and longitude
async function getMenu(client_id, client_secret, restaurant_name, lat, lon) {
	var venue_id = null;

	try {
		// Search for venue
		var results = await request({
			url: "https://api.foursquare.com/v2/venues/search",
			method: "GET",
			qs: {
				client_id: client_id,
				client_secret: client_secret,
				v: "20181116",
				query: encodeURI(restaurant_name),
				limit: 1,
				ll: lat + "," + lon
			}
		}).json()

		if (!results.meta) {
			throw new Error("Error with request")
		}

		// Parse venue id
		if (results.meta.code == 200) {
			venue_id = results.response.venues[0].id
		} else {
			throw new Error("Error fetching venue")
		}

		// Get menu
		var menu_url = "https://api.foursquare.com/v2/venues/" + venue_id + "/menu"
		menu_url += "?client_id=" + client_id + "&client_secret=" + client_secret + "&v=20181116"

		results = await request({
			url: menu_url,
			method: "GET"
		}).json()

		if (!results.meta) {
			throw new Error("Error with request")
		}

		// Parse menu items
		if (results.meta.code == 200) {
			var menu = results.response.menu.menus.items
			var menu_items = []		// all menu items

			//iterate through menu to get items
			if (menu.length > 0) {
				for (var i = 0; i < menu.length; i++)
					for (var j = 0; j < menu[i].entries.count; j++)
						for (var k = 0; k < menu[i].entries.items[j].entries.count; k++)
							menu_items.push(menu[i].entries.items[j].entries.items[k].name)
				
				return menu_items
			} else {
				throw new Error("No menu available")
			}
		} else {
			throw new Error("Error fetching menu")
		}		
	}
	catch (error) {
		console.log(error)
	}
}

module.exports = {
	getMenu
}

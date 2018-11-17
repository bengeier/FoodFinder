const client_id = "VCRNKCHGA1ZH4ALEJ5TEZPGPUXVKWVPICA1M0J2KF5IBMJ33"
const client_secret = "GPVYWMMB41WF4VM2JGPK030PXUTCQDHGJEIO30TYATWMV2IF"
var lat = "33.416178808321426"
var lon = "-111.872781158"
var search_url = "https://api.foursquare.com/v2/venues/search?limit=1&ll=" + lat + "," + lon
var restaurant_name = "Starbucks"
search_url += "&query=" + encodeURI(restaurant_name)
search_url += "&client_id=" + client_id + "&client_secret=" + client_secret + "&v=20181116"

/** Example to test
 * "name":"Starbucks","latitude":33.4165848044,"longitude":-111.872781158
 * "name": "Wendy's", "latitude":40.2634088,"longitude":-80.1738737
 */

// Get restaurant menu given name, latitude, and longitude
var venue_id = null;
fetch(search_url)
	.then(response => {
		return response.json()
	})
	.then(response => {
		if (response.meta.code == 200) {
			// success
			venue_id = response.response.venues[0].id

			return venue_id
		} else {
			throw new Error("Error fetching venue")
		}
	})
	.then(venue_id => {
		// get menu
		var menu_url = "https://api.foursquare.com/v2/venues/" + venue_id + "/menu"
		menu_url += "?client_id=" + client_id + "&client_secret=" + client_secret + "&v=20181116"
		
		fetch(menu_url)
			.then(response => {
				return response.json()
			})
			.then(response => {
				if (response.meta.code == 200) {
					// success
					var menu = response.response.menu.menus.items
					var menu_items = []		// all menu items

					// iterate through menu to get items
					if (menu.length > 0) {
						for (var i = 0; i < menu.length; i++)
							for (var j = 0; j < menu[i].entries.count; j++)
								for (var k = 0; k < menu[i].entries.items[j].entries.count; k++)
									menu_items.push(menu[i].entries.items[j].entries.items[k].name)
							
						//console.log(menu_items)
						return menu_items
					} else {
					// Menu doesn't exist
					throw new Error("No menu available")
					}
				} else {
					// Couldn't make request
					throw new Error("Error fetching menu")
				}
			})
			.then(menu_items => {
				console.log(menu_items)
			})
	})
	.catch(error => {
		console.log(error.message)
	})
// Returns a list of most positively ranked menu items for menu items
// Only returns list of menu items without values
// Assumes input is an object with key as menu items and value as # positive reviews
// or sum of sentiment score
function rank(list) {
	return Object.keys(list).sort(function(a,b) { return list[b] - list[a] })
}

module.exports = {
	rank
}
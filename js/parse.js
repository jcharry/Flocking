// Parse
Parse.initialize("xa0SQKjqG0GNFMiaAoprMRrPyVVkIfMGMmBHhsKw", "fqrWimXMv1DAmVhh7YuOogp77xhINze5aKrLC8u8");

// Fetch data from parse
var nodes = [];
function fetchNodes() {
  // Load Parse Data
  var PNode = Parse.Object.extend('Node'); 
  var query = new Parse.Query(PNode);
  query.find({
    
    success: function(results) {
      console.log('successfully retrieved ' + results.length + ' items');
      for (var i = 0; i < results.length; i++) {
	var object = results[i];
	var n = object.get('name');
	
	if (n.length === 0) {
	  n = 'anon';
	}
	var e = object.get('emotion');
	var l = object.get('location');
	nodes.push(new Node(n,e,l));
      }
      // After all nodes have loaded, init scene
    },
    error: function(error) {
      alert('error: ' + error.code + ' ' + error.message);
    }
  });
}

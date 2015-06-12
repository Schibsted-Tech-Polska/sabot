module.exports = reportThroughCallbacks;

var STORED_CONVERSIONS = require('./constants').STORED_CONVERSIONS;

function reportThroughCallbacks(assignments, storage, onVariantChosen, onConversion) {
  // report which variants were loaded
  Object.keys(assignments).map(function(test) {
    onVariantChosen(test, assignments[test]);
  });

  // report conversions from previous visits
  var conversions = storage.getItem(STORED_CONVERSIONS) || [];
  conversions.map(function(c) {
    onConversion(c.test, c.variant);
  });
}

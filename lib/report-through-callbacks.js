module.exports = reportThroughCallbacks;

var STORED_CONVERSIONS = require('./constants').STORED_CONVERSIONS;

function reportThroughCallbacks(assignments, storage, onVariantChosen, onConversion) {
  // if we can't rely on the local storage (e.g. private mode on Safari)
  // we skip reporting completely in order not to skew the data.
  // if we can't write to local storage, test assignments would still report,
  // but conversions wouldn't, low-balling the conversion rate
  if (storage.writesAreFailing) {
    return;
  }

  // report which variants were loaded
  Object.keys(assignments).map(function(test) {
    onVariantChosen(test, assignments[test]);
  });

  // report conversions from previous visits
  var conversions = storage.getItem(STORED_CONVERSIONS) || [];
  conversions.map(function(c) {
    $.when(onConversion(c.test, c.variant)).then(conversionReported(c));
  });

  // callback factory for removing successfully reported conversions
  function conversionReported(conversionToRemove) {
    return function() {
      // remove the conversion from the outstanding list
      var conversions = storage.getItem(STORED_CONVERSIONS) || [];
      var filtered = conversions.filter(function(c) {
        return JSON.stringify(c) != JSON.stringify(conversionToRemove);
      });
      storage.setItem(STORED_CONVERSIONS, filtered);
    }
  }
}

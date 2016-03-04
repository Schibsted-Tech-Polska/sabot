module.exports = registerConversionListeners;

var STORED_CONVERSIONS = require('./constants').STORED_CONVERSIONS;

function registerConversionListeners($root, tests, storage) {
  tests.map(function(t) {
    var selector = '*[data-ab^='+t.name+']';
    var $testsContainers = $root.find(selector);
    var testName = t.name;
    var variantName = extractSelectedVariantName($testsContainers);
    var conversion = t.conversion;

    if(!conversion) {
      console.error("WARNING: Container with data-ab='" + extractDataAB($testsContainers) + "' has no matching test defined.");
      return;
    }

    var $bindTo = conversion.global ? $root : $testsContainers;
    var eventBinder = domBinder($bindTo, conversion.event);
    var callback = createConversionCallback(conversion.selector, testName, variantName, eventBinder, storage);
    eventBinder.register(callback);
  });
}

function extractSelectedVariantName($containers) {
  var testInfo = extractDataAB($containers).split(':');
  return testInfo[1];
}

function extractDataAB($containers) {
  return $containers.toArray()[0].getAttribute('data-ab');
}

function createConversionCallback(selector, test, variant, eventBinder, storage) {
  var callback = function(evt) {
    // filter - only elements that match our selector or are contained within such a matching element
    var $target = $(evt.target);
    var match = $target.closest(selector);
    if (!match.length) return;

    // conversions are just saved to local storage, and sent during page load of the next page
    var conversionData = {test: test, variant: variant};
    var conversions = storage.getItem(STORED_CONVERSIONS) || [];

    conversions.push(conversionData);
    storage.setItem(STORED_CONVERSIONS, conversions);

    // every conversion happens only once, so we don't want to be called again
    eventBinder.unregister(callback);
  };
  return callback;
}

function domBinder($node, eventName) {
  return {
    register: function(callback) {
      $node.each(function() {
        this.addEventListener(eventName, callback, true);
      });
    },
    unregister: function(callback) {
      $node.each(function() {
        this.removeEventListener(eventName, callback, true);
      });
    }
  }
}

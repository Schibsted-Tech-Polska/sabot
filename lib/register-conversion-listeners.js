module.exports = registerConversionListeners;

var STORED_CONVERSIONS = require('./constants').STORED_CONVERSIONS;

function registerConversionListeners($root, tests, storage) {
  var containers = $root.find('*[data-ab]').toArray();
  containers.map(function(c) {
    var $container = $(c);
    var testInfo = $container.data('ab').split(':');
    var testName = testInfo[0], variantName = testInfo[1];

    var conversion;
    tests.map(function(t) {
      if (t.name == testName)
        conversion = t.conversion;
    });
    if (!conversion) {
      console.error("WARNING: Container with data-ab='" + $container.data('ab') + "' has no matching test defined.");
      return;
    }

    var eventBinder = jqueryEventBinder($container, conversion.event);
    var callback = createConversionCallback(conversion.selector, testName, variantName, eventBinder, storage);
    eventBinder.register(callback);
  });
}

function createConversionCallback(selector, test, variant, eventBinder, storage) {
  var callback = function(evt) {
    // filter - only elements we're interested in
    var $target = $(evt.target);
    if (!$target.is(selector)) return;

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

function jqueryEventBinder($node, eventName) {
  return {
    register: $node.on.bind($node, eventName),
    unregister: $node.off.bind($node, eventName)
  };
}

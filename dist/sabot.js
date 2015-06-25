(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = assignUserToVariants;

var STORED_ASSIGNMENTS = require('./constants').STORED_ASSIGNMENTS;

function assignUserToVariants(tests, storage, randomizer) {
  var assignments = storage.getItem(STORED_ASSIGNMENTS) || {};
  tests.map(function(test) {
    var previous = assignments[test.name];
    if (previous) {
      // check if the saved variant actually exists in this test
      var variantExists = test.variants.some(function(v) {
        return v.name == previous;
      });
      // already assigned for the test, we're good
      if (variantExists)
        return;
    }

    // new assignment needed for the test, pick one
    assignments[test.name] = pickVariantRandomly(test.variants, randomizer);
  });
  storage.setItem(STORED_ASSIGNMENTS, assignments);

  // filter so only assignments for the tests existing on the page are returned
  var filtered = {};
  tests.map(function(test) {
    filtered[test.name] = assignments[test.name];
  });
  return filtered;
}

// Randomly picks one of the variants, using probabilities defined by weights. All the weights must sum up to 1.
function pickVariantRandomly(choices, random) {
  var pick = random();
  var soFar = 0.0, index = 0;
  while (true) {
    if (pick < choices[index].weight + soFar) {
      return choices[index].name;
    } else {
      soFar += choices[index].weight;
      index++;
    }
  }
}

},{"./constants":2}],2:[function(require,module,exports){
module.exports.STORED_ASSIGNMENTS = 'sabotTestAssignments';
module.exports.STORED_CONVERSIONS = 'sabotOutstandingConversions';


},{}],3:[function(require,module,exports){
window.sabot = function(){
  var ObjectStorage = main.ObjectStorage = require('./object-storage');

  var parseTests = main.parseTests = require('./parse-tests');
  var assignUserToVariants = main.assignUserToVariants = require('./assign-user-to-variants');
  var removeUnselectedVariants = main.removeUnselectedVariants = require('./remove-unselected-variants');
  var reportThroughCallbacks = main.reportThroughCallbacks = require('./report-through-callbacks');
  var registerConversionListeners = main.registerConversionListeners = require('./register-conversion-listeners');

  return main;

  function main(cfg) {
    cfg = sanitizeConfig(cfg);

    var $root = $(cfg.rootElement);

    var tests = parseTests($root);
    var assignments = assignUserToVariants(tests, cfg.storage, cfg.randomizer);
    removeUnselectedVariants($root, assignments);
    reportThroughCallbacks(assignments, cfg.storage, cfg.onVariantChosen, cfg.onConversion);
    registerConversionListeners($root, tests, cfg.storage);
  }

  function sanitizeConfig(cfg) {
    return {
      rootElement: cfg.rootElement || 'html',
      storage: new ObjectStorage(cfg.storage || window.localStorage),
      randomizer: cfg.randomizer || Math.random.bind(Math),

      onVariantChosen: cfg.onVariantChosen || pleaseRegister('onVariantChosen'),
      onConversion: cfg.onConversion || pleaseRegister('onConversion')
    }
  }

  function pleaseRegister(functionName) {
    console.log("No callback was registered for A/B testing - please register '" + functionName + "'.");
    return function() {
    }
  }

}();

},{"./assign-user-to-variants":1,"./object-storage":4,"./parse-tests":5,"./register-conversion-listeners":6,"./remove-unselected-variants":7,"./report-through-callbacks":8}],4:[function(require,module,exports){
// Implements storing JS objects inside string-based browser storage.

module.exports = ObjectStorage;

function ObjectStorage(storage) {
  this.storage = storage;
}
ObjectStorage.prototype = {
  setItem: function(key, object) {
    return this.storage.setItem(key, JSON.stringify(object));
  },
  getItem: function(key) {
    var storedString = this.storage.getItem(key);
    if (storedString) {
      try {
        return JSON.parse(storedString);
      } catch(e) {
        // parsing error? assume undefined
        return undefined;
      }
    } else {
      return undefined;
    }
  }
};

},{}],5:[function(require,module,exports){
module.exports = parseTests;

var WEIGHT_REGEX = /\((.*?)\)/;

function parseTests($rootElement) {
  var metaElements = $rootElement.find("meta[type='ab-test']");

  return metaElements.toArray().map(function(node) {
    var $meta = $(node);
    return {
      name: $meta.data('name'),
      variants: parseVariants($meta.data('variants')),
      conversion: parseConversion($meta.data('conversion-event'))
    };
  });
}

// Parses the data-variants attribute into a list of variants with weights.
function parseVariants(attributeText) {
  var variants = attributeText.split(",").map(function(variantText) {
    // try to find the weight, if it was defined
    var weightMatch = WEIGHT_REGEX.exec(variantText);
    var weight = weightMatch ? parseFloat(trim(weightMatch[1])) : 1;

    // the name of the variant is whatever is left after removing the weight, trimmed of whitespace
    var name = trim(variantText.replace(WEIGHT_REGEX, ''));

    // done!
    return {name: name, weight: weight};
  });
  return normalizeWeights(variants);
}

// Normalizes variant weights so that they sum up to 1.
function normalizeWeights(variants) {
  var totalWeight = variants
    .map(function(v) { return v.weight; })
    .reduce(function(total, weight) { return total + weight; }, 0.0);

  return variants.map(function(v) {
    return {name: v.name, weight: v.weight / totalWeight};
  });
}

// Parses the data-conversion-event into an object.
function parseConversion(attributeText) {
  var parts = attributeText.split("|");
  return {
    selector: parts[0],
    event: parts[1]
  };
}

function trim(str) {
  return str.replace(/^\s+|\s+$/g, '');
}

},{}],6:[function(require,module,exports){
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

    var eventBinder = domBinder($container, conversion.event);
    var callback = createConversionCallback(conversion.selector, testName, variantName, eventBinder, storage);
    eventBinder.register(callback);
  });
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

},{"./constants":2}],7:[function(require,module,exports){
module.exports = removeUnselectedVariants;

function removeUnselectedVariants($root, assignments) {
  // remove everything that doesn't match a test
  var candidates = $root.find('*[data-ab]');
  candidates.toArray().map(function(candidate) {
    var $candidate = $(candidate);
    var abInfo = $candidate.data('ab').split(":");
    var abTest = abInfo[0], abVariant = abInfo[1];
    if (assignments[abTest] != abVariant)
      $candidate.remove();
  });
}

},{}],8:[function(require,module,exports){
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

},{"./constants":2}]},{},[3]);

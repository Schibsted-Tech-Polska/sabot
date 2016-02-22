(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = assignUserToVariants;

var STORED_ASSIGNMENTS = require('./constants').STORED_ASSIGNMENTS;

// creates a map of {testName: selectedVariant}, ensuring that randomized assignments
// are properly stored
function assignUserToVariants(tests, storage, randomizer, validityTimeInSeconds) {
  // get stored stuff
  var assignments = storage.getItem(STORED_ASSIGNMENTS) || {};

  // some of the stored assignments might be expired
  removeExpiredAssignments(assignments);

  // for each test, either listen to the stored entry (if it's present and valid)
  // or generate a new assignment randomly
  tests.map(function(test) {
    var previous = assignments[test.name];
    if (previous) {
      // check if the saved variant actually exists in this test, and is still applicable
      var variantExists = test.variants.some(function(v) {
        var nameMatches = (v.name == previous.pick);
        return nameMatches && (variantIsApplicable(v));
      });

      // already assigned for the test, we're good
      if (variantExists)
        return;
    }

    // new assignment needed for the test, pick one
    assignments[test.name] = generateNewAssignment(test, randomizer, validityTimeInSeconds);
  });

  // updated assignments go back into storage
  storage.setItem(STORED_ASSIGNMENTS, assignments);

  // create the final structure with just the tests we're interested in
  var final = {};
  tests.map(function(test) {
    final[test.name] = assignments[test.name].pick;
  });
  return final;
}

function generateNewAssignment(test, randomizer, validForSec) {
  var pick;
  do {
    pick = pickVariantRandomly(test.variants, randomizer);
  } while (!variantIsApplicable(pick));

  return {
    pick: pick.name,
    expires: (new Date()).getTime() + validForSec * 1000
  };
}

// Checks if all conditions specified on the test pass.
function variantIsApplicable(variant) {
  var conditions = variant.conditions || [];
  return conditions.every(function(condition) {
    return condition();
  });
}

// Removes all assignment entries that have an 'expired' property in the past.
function removeExpiredAssignments(assignments) {
  var expiredTests = Object.keys(assignments).filter(function(test) {
    var assignment = assignments[test];
    return (!assignment.expires) || (assignment.expires < (new Date().getTime()));
  });

  expiredTests.map(function(test) {
    delete assignments[test];
  });
}

// Randomly picks one of the variants, using probabilities defined by weights. All the weights must sum up to 1.
function pickVariantRandomly(choices, random) {
  var pick = random();
  var soFar = 0.0, index = 0;
  while (true) {
    if (pick < choices[index].weight + soFar) {
      return choices[index];
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

  main.ObjectStorage = ObjectStorage; // access to class for tests, mainly

  return main;

  function main(cfg) {
    cfg = sanitizeConfig(cfg);

    var $root = $(cfg.rootElement);

    var tests = parseTests($root, cfg.warningFn, cfg.conditions);
    var assignments = assignUserToVariants(tests, cfg.storage, cfg.randomizer, cfg.expirationTime);
    removeUnselectedVariants($root, assignments, cfg.selectedClass);
    reportThroughCallbacks(assignments, cfg.storage, cfg.onVariantChosen, cfg.onConversion);
    registerConversionListeners($root, tests, cfg.storage);
  }

  function sanitizeConfig(cfg) {

    return {
      rootElement: cfg.rootElement || 'html',

      storage: new ObjectStorage(cfg.storage || defaultStorage()),
      randomizer: cfg.randomizer || Math.random.bind(Math),

      expirationTime: cfg.expirationTime || 7 * 24 * 3600,
      selectedClass: cfg.selectedClass || 'ab-selected',

      warningFn: cfg.warningFn || defaultErrorLogger,

      onVariantChosen: cfg.onVariantChosen || pleaseRegister(cfg, 'onVariantChosen'),
      onConversion: cfg.onConversion || pleaseRegister(cfg, 'onConversion'),

      conditions: cfg.conditions || {}
    };
  }

  function pleaseRegister(cfg, functionName) {
    var warningFn = cfg.warningFn;
    warningFn("Missing callback for A/B testing - please register '" + functionName + "'.");

    return function() {
    }
  }

  function defaultStorage() {
    // to get around security errors and such
    try {
      return window.localStorage;
    } catch(e) {
      return undefined;
    }
  }

  function defaultErrorLogger(message) {
    console.log(message);
  }

}();

},{"./assign-user-to-variants":1,"./object-storage":4,"./parse-tests":5,"./register-conversion-listeners":6,"./remove-unselected-variants":7,"./report-through-callbacks":8}],4:[function(require,module,exports){
// Implements storing JS objects inside string-based browser storage.

module.exports = ObjectStorage;

function ObjectStorage(storage) {
  this.storage = storage;
  this.writesAreFailing = false;
}
ObjectStorage.prototype = {
  setItem: function(key, object) {
    if (!this.storage) return; // turn into no-op if there is no localStorage available

    try {
      return this.storage.setItem(key, JSON.stringify(object));
    } catch(e) {
      this.writesAreFailing = true;
      console.log("[Sabot] Couldn't write to local storage, A/B test assignments/conversions will not be reported.");
    }
  },

  getItem: function(key) {
    if (!this.storage) return; // turn into no-op if there is no localStorage available

    try {
      var storedString = this.storage.getItem(key);
    } catch(e) {
      return undefined;
    }

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

var EXTRAS_REGEX = /\((.*?)\)/;

function parseTests($rootElement, raiseWarning, conditionMap) {
  var metaElements = $rootElement.find("meta[type='ab-test']");
  raiseWarning = raiseWarning || function(w) { console.error(w); };
  conditionMap = conditionMap || {};

  var tests = metaElements.toArray().map(function(node) {
    var $meta = $(node);

    try {
      var everythingProvided = $meta.data('name') && $meta.data('variants')
        && ($meta.data('conversion-event') || $meta.data('conversion-event-global'));
      if (!everythingProvided)
        throw new Error("data-name, data-variants and data-conversion-event(-global) have to be provided for each test.");

      var conversion;
      if ($meta.data('conversion-event-global')) {
        conversion = parseConversion($meta.data('conversion-event-global'), true);
      } else {
        conversion = parseConversion($meta.data('conversion-event'), false);
      }

      return {
        name: parseName($meta.data('name')),
        variants: parseVariants($meta.data('variants'), conditionMap),
        conversion: conversion
      };
    } catch(e) {
      raiseWarning("Error parsing test '" + $meta.data('name') + "': " + e.message.toString());
      return null;
    }
  }).filter(notNull);

  checkContainerValidity($rootElement, tests, raiseWarning);

  return tests;
}

// Parses and validates the test name.
function parseName(testName) {
  if (!isCorrectIdentifier(testName)) {
    throw new Error("Test names should be alphanumeric + dash/underscore, found: " + testName);
  }
  return testName;
}

// Parses the data-variants attribute into a list of variants with weights.
function parseVariants(attributeText, conditionMap) {
  var variants = attributeText.split(",").map(function(variantText) {
    // the name of the variant is whatever is left after removing the extra info, trimmed of whitespace
    var name = trim(variantText.replace(EXTRAS_REGEX, ''));

    // do we have extra info?
    var extraMatch = EXTRAS_REGEX.exec(variantText);
    var extras = extraMatch ? extraMatch[1].split(":").map(trim) : [];

    // extract the weight
    var weight = extras.length ? parseFloat(trim(extras[0])) : 1;
    if (isNaN(weight) || (weight <= 0))
      throw new Error("Incorrect weight provided: " + variantText);

    // any conditions?
    var conditionNames = extras.slice(1);
    var conditions = conditionNames.map(function(cName) {
      var condition = conditionMap[cName];
      if (!condition) {
        throw new Error("Variant specification: '" + variantText + "' uses unknown condition '" + cName + "'.");
      }
      return condition;
    });

    // check if the name is valid
    if (!isCorrectIdentifier(name)) {
      throw new Error("Test variants should be alphanumeric + dash/underscore, found: " + name);
    }

    // done!
    return {name: name, weight: weight, conditions: conditions};
  });
  return normalizeWeights(variants);
}

// Normalizes variant weights so that they sum up to 1.
function normalizeWeights(variants) {
  var totalWeight = variants
    .map(function(v) { return v.weight; })
    .reduce(function(total, weight) { return total + weight; }, 0.0);

  return variants.map(function(v) {
    return {name: v.name, weight: v.weight / totalWeight, conditions: v.conditions};
  });
}

// Parses the data-conversion-event into an object.
function parseConversion(attributeText, global) {
  var parts = attributeText.split("|");
  if (parts.length != 2)
    throw new Error("The conversion event should be in the form of 'selector|event', found: '" + attributeText + "'.");

  return {
    selector: parts[0],
    event: parts[1],
    global: !!global
  };
}

// Checks all the data-ab containers to see if all have matching tests/variants.
function checkContainerValidity($root, tests, raiseWarning) {
  var $abContainers = $root.find('*[data-ab]');
  $abContainers.each(function() {
    var $container = $(this);
    var ab = $container.data('ab');
    var parts = ab.split(":");

    // check the data-ab value for correctness
    if (parts.length != 2)
      return raiseWarning("Incorrect data-ab value: '" + ab + "'.");
    var matchingTest = tests.filter(function(t) { return t.name == parts[0] });
    matchingTest = matchingTest.length ? matchingTest[0] : false;
    if (!matchingTest)
      return raiseWarning("No matching test defined for data-ab='" + ab + "'.");
    var matchingVariants = matchingTest.variants.filter(function(v) { return v.name == parts[1]; });
    if (!matchingVariants.length)
      return raiseWarning("No matching variant defined for data-ab='" + ab + "'.");
  });
}

// Helpers
function trim(str) {
  return str.replace(/^\s+|\s+$/g, '');
}

function notNull(x) {
  return !!x;
}

function isCorrectIdentifier(id) {
  return /^[-_A-Za-z0-9]+$/.test(id);
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

    var $bindTo = conversion.global ? $root : $container;
    var eventBinder = domBinder($bindTo, conversion.event);
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

function removeUnselectedVariants($root, assignments, selectedClass) {
  // remove everything that doesn't match a test
  var candidates = $root.find('*[data-ab]');
  candidates.toArray().map(function(candidate) {
    var $candidate = $(candidate);
    var abInfo = $candidate.data('ab').split(":");
    var abTest = abInfo[0], abVariant = abInfo[1];

    if (assignments[abTest] == abVariant) {
      $candidate.addClass(selectedClass);
    } else {
      $candidate.remove();
    }
  });
}

},{}],8:[function(require,module,exports){
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

},{"./constants":2}]},{},[3]);

module.exports = parseTests;

var EXTRAS_REGEX = /\((.*?)\)/;

function parseTests($rootElement, raiseWarning, conditionMap) {
  var metaElements = $rootElement.find("meta[type='ab-test']");
  raiseWarning = raiseWarning || function(w) { console.error(w); };
  conditionMap = conditionMap || {};

  var tests = metaElements.toArray().map(function(node) {
    var $meta = $(node);

    try {
      var everythingProvided = $meta.data('name') && $meta.data('variants') && $meta.data('conversion-event');
      if (!everythingProvided)
        throw new Error("data-name, data-variants and data-conversion-event have to be provided for each test.");

      return {
        name: parseName($meta.data('name')),
        variants: parseVariants($meta.data('variants'), conditionMap),
        conversion: parseConversion($meta.data('conversion-event'))
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
function parseConversion(attributeText) {
  var parts = attributeText.split("|");
  if (parts.length != 2)
    throw new Error("data-conversion-event should be in the form of 'selector|event', found: '" + attributeText + "'.");

  return {
    selector: parts[0],
    event: parts[1]
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

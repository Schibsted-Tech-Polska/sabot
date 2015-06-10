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
    var weight = weightMatch ? parseFloat(weightMatch[1]) : 1;

    // the name of the variant is whatever is left after removing the weight
    var name = variantText.replace(WEIGHT_REGEX, '');

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

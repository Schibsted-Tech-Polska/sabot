window.sabot = function(){
  setupTests.parseTests = parseTests;
  return setupTests;

  function setupTests(cfg) {

  }

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

  function parseVariants(attributeText) {
    return attributeText.split(",").map(function(variantText) {
      // try to find the weight, if it was defined
      var WEIGHT_REGEX = /\((\d+\D*)\)/;
      var weightMatch = WEIGHT_REGEX.exec(variantText);
      var weight = weightMatch ? parseInt(weightMatch[1]) : 1;

      // the name of the variant is whatever is left after removing the weight
      var name = variantText.replace(WEIGHT_REGEX, '');

      // done!
      return {name: name, weight: weight};
    });
  }

  function parseConversion(attributeText) {
    var parts = attributeText.split("|");
    return {
      selector: parts[0],
      event: parts[1]
    };
  }

}();

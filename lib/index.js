window.sabot = function(){
  var parseTests = main.parseTests = require('./parsing');
  var assignUserToVariants = main.assignUserToVariants = require('./user-assignment');
  var removeUnselectedVariants = main.removeUnselectedVariants = require('./remove-unselected-variants');
  var reportLoadedVariants = main.reportLoadedVariants = require('./report-loaded-variants');

  return main;

  function main(cfg) {
    // sanitize configuration
    cfg = sanitizeConfig(cfg);

    // parse the tests to be performed
    var $root = $(cfg.rootElement);
    var tests = parseTests($root);
    var assignments = assignUserToVariants(tests, cfg.storage);
    removeUnselectedVariants($root, assignments);
    reportLoadedVariants(assignments, cfg.onVariantChosen);

    console.log(assignments);

    /*registerConversionListeners($root, tests, cfg.onVariantConversion);*/
  }

  function sanitizeConfig(cfg) {
    return {
      rootElement: cfg.rootElement || 'html',
      storage: cfg.storage || window.localStorage,

      onVariantChosen: cfg.onVariantChosen || pleaseRegister('onVariantChosen')
    }
  }

  function pleaseRegister(functionName) {
    console.log("No callback was registered for A/B testing - please register '" + functionName + "'.");
    return function() {
    }
  }

}();

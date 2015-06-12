window.sabot = function(){
  var parseTests = main.parseTests = require('./parsing');
  var assignUserToVariants = main.assignUserToVariants = require('./user-assignment');
  var removeUnselectedVariants = main.removeUnselectedVariants = require('./remove-unselected-variants');
  var reportThroughCallbacks = main.reportThroughCallbacks = require('./report-through-callbacks');
  var registerConversionListeners = main.registerConversionListeners = require('./register-conversion-listeners');

  return main;

  function main(cfg) {
    // sanitize configuration
    cfg = sanitizeConfig(cfg);

    // parse the tests to be performed
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
      storage: cfg.storage || window.localStorage,
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
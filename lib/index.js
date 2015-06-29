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
    var assignments = assignUserToVariants(tests, cfg.storage, cfg.randomizer, cfg.expirationTime);
    removeUnselectedVariants($root, assignments);
    reportThroughCallbacks(assignments, cfg.storage, cfg.onVariantChosen, cfg.onConversion);
    registerConversionListeners($root, tests, cfg.storage);
  }

  function sanitizeConfig(cfg) {
    return {
      rootElement: cfg.rootElement || 'html',
      storage: new ObjectStorage(cfg.storage || window.localStorage),
      randomizer: cfg.randomizer || Math.random.bind(Math),
      expirationTime: 7 * 24 * 3600,

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

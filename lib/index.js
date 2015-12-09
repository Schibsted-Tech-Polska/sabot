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

    var tests = parseTests($root, cfg.warningFn, cfg.conditions);
    var assignments = assignUserToVariants(tests, cfg.storage, cfg.randomizer, cfg.expirationTime);
    removeUnselectedVariants($root, assignments, cfg.selectedClass);
    reportThroughCallbacks(assignments, cfg.storage, cfg.onVariantChosen, cfg.onConversion);
    registerConversionListeners($root, tests, cfg.storage);
  }

  function sanitizeConfig(cfg) {
    return {
      rootElement: cfg.rootElement || 'html',

      storage: new ObjectStorage(cfg.storage || window.localStorage),
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

  function defaultErrorLogger(message) {
    console.log(message);
  }

}();

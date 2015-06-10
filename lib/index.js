window.sabot = function(){
  var parseTests = main.parseTests = require('./parsing');
  var assignUserToVariants = main.assignUserToVariants = require('./user-assignment');

  return main;

  function main(cfg) {
    // sanitize configuration
    cfg = sanitizeConfig(cfg);

    // parse the tests to be performed
    var $root = $(cfg.rootElement);
    var tests = parseTests($root);
    var assignments = assignUserToVariants(tests, cfg.storage);
    console.log(assignments);

    /*removeContainersForUnselectedVariants(assignments);
    reportLoadedVariants(assignments);
    registerConversionListeners(tests);*/
  }

  function sanitizeConfig(cfg) {
    return {
      rootElement: cfg.rootElement || 'html',
      storage: cfg.storage || window.localStorage
    }
  }


}();

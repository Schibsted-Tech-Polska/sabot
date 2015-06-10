window.sabot = function(){
  var parseTests = setupTests.parseTests = require('./parsing');
  return setupTests;

  function setupTests(cfg) {
    // sanitize configuration
    cfg = sanitizeConfig(cfg);

    // parse the tests to be performed
    var $root = $(cfg.rootElement);
    var tests = parseTests($root);
  }

  function sanitizeConfig(cfg) {
    return {
      rootElement: cfg.rootElement || 'html'
    }
  }


}();

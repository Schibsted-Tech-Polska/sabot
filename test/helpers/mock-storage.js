window.mockStorage = function(initial) {
  initial = initial || {};
  for (var prop in initial) {
    if (typeof(initial[prop]) !== 'string')
      initial[prop] = JSON.stringify(initial[prop]);
  }

  var store = initial;
  return {
    getItem: function(name) { return store[name] },
    setItem: function(name, value) { return store[name] = value.toString(); }
  };
};


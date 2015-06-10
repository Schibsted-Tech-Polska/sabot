window.mockStorage = function(initial) {
  var store = initial || {};
  return {
    getItem: function(name) { return store[name] },
    setItem: function(name, value) { return store[name] = value; }
  };
};


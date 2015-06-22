// Implements storing JS objects inside string-based browser storage.

module.exports = ObjectStorage;

function ObjectStorage(storage) {
  this.storage = storage;
}
ObjectStorage.prototype = {
  setItem: function(key, object) {
    return this.storage.setItem(key, JSON.stringify(object));
  },
  getItem: function(key) {
    var storedString = this.storage.getItem(key);
    if (storedString) {
      try {
        return JSON.parse(storedString);
      } catch(e) {
        // parsing error? assume undefined
        return undefined;
      }
    } else {
      return undefined;
    }
  }
};

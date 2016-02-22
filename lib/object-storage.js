// Implements storing JS objects inside string-based browser storage.

module.exports = ObjectStorage;

function ObjectStorage(storage) {
  this.storage = storage;
  this.writesAreFailing = false;
}
ObjectStorage.prototype = {
  setItem: function(key, object) {
    if (!this.storage) return; // turn into no-op if there is no localStorage available

    try {
      return this.storage.setItem(key, JSON.stringify(object));
    } catch(e) {
      this.writesAreFailing = true;
      console.log("[Sabot] Couldn't write to local storage, A/B test assignments/conversions will not be reported.");
    }
  },

  getItem: function(key) {
    if (!this.storage) return; // turn into no-op if there is no localStorage available

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

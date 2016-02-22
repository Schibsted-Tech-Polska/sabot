describe("ObjectStorage", function() {
  it("should not break when localStorage is unimplemented", function() {
    var store = new sabot.ObjectStorage(undefined);
    store.setItem('key', {hi: 'there'});
    assert.strictEqual(store.getItem('key'), undefined);
  });
});

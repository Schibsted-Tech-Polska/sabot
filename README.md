# sabot

[![Build Status](https://travis-ci.org/Schibsted-Tech-Polska/sabot.svg?branch=master)](https://travis-ci.org/Schibsted-Tech-Polska/sabot)

Sabot (Simple A/B Testing tool) is a client-side library for A/B testing with minimal setup and requirements.

* tests are set up directly in your HTML markup
* runs entirely on the client-side
* can report to any backend of your choosing with a minimal amount of glue-code

## Requirements

JQuery has to be available in the environment for sabot to work.

## Setup

You need the sabot.js file - the easiest way is using bower:

```sh
# bower install --save sabot
```

And in your HTML:

```html
<script src="bower_components/sabot/dist/sabot.js"></script>
```

First, you have to set up a test with a `<meta>` tag.

```html
  <meta type="ab-test" 
        data-name="colorful"             
        data-variants="red(10%), green(90%)"
        data-conversion-event=".button|click">
```

* **data-name** - that's the name of the test you want to run
* **data-variants** - these are all the possible variants the test will include, along with what percentage of users
  you want to present with a given variant
* **data-conversion-event** - a selector and a DOM event that will say "successful conversion" - the example means
  "whenever somebody clicks on an element with class 'button'". You can use any JQuery-compatible selector as the
  first part, and any DOM event as the second.
  
Once you have a test set up, variants are trivial to do:

```html
  <div data-ab="colorful:red">
    <a class="button button-red">Subscribe!</a>
  </div>
  <div data-ab="colorful:green">
    <a class="button button-green">Interested?</a>
  </div>
```

Sabot will pick one variant per-test (according to the rules in the meta tag), and leave just those containers that are
marked with `data-ab="test:<picked-variant>"`.


## Reporting

Sabot can report to any back-end. It accepts two callbacks - one will be called when a variant is picked, the other -
when a successful conversion is recorded. It expects the callbacks to return a promise/deferred, so you can return the
result of `$.ajax()` directly:

```javascript
sabot({
  onVariantChosen: function(test, variant) {
    var url = "http://my-backend.example.com/?test=" + test + "&variant=" + variant;
    return $.ajax({type: 'PUT', url: url}); // send a PUT request.
  },
  onConversion: function(test, variant) { ... }
});
```

And that's it - you should be set up for your A/B tests!

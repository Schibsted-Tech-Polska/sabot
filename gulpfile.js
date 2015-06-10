var gulp = require('gulp');

// =====================

gulp.task('default', ['build-distribution']);

gulp.task('build-distribution', function() {
  var browserify = require('browserify');
  var source = require('vinyl-source-stream');

  // production version
  return browserify({
    entries: 'lib/index.js'
  }).bundle()
    .pipe(source('sabot.js'))
    .pipe(gulp.dest('./dist'));
});

var gulp = require('gulp');

// =====================

gulp.task('default', ['build-distribution']);

gulp.task('build-distribution', function() {
    var concat = require('gulp-concat');

    // production version
    gulp.src([
      "lib/index.js"
    ]).pipe(concat('sabot.js'))
      .pipe(gulp.dest('dist/'));
});

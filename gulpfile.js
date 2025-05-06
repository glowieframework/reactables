const gulp = require('gulp');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const watch = require('gulp-watch');

function scripts() {
  return gulp.src('src/Assets/*.js')
    .pipe(concat('reactables.dist.min.js'))
    .pipe(terser())
    .pipe(gulp.dest('src/Assets/dist'));
}

function watchFiles() {
  watch('src/Assets/*.js', {ignoreInitial: false, verbose: true}, scripts);
}

exports.default = gulp.series(scripts);
exports.watch = gulp.series(scripts, watchFiles);
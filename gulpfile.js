// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gls = require('gulp-live-server');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src(['bot.js', 'lib/*.js'])
        .pipe(concat('all.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch(['bot.js', 'js/*.js', 'views/*.pug'], ['lint', 'scripts', 'serve']);
});

gulp.task('serve', function () {
    var server = gls.new('server.js');
    server.start();
    
    gulp.watch(
        [
            "views/*.pug",
            "views/*.js",
            "lib/*.js"
        ],
        function (file) {
        	server.start();
            server.notify(file);
        });

    gulp.watch("server.js", function (file) {
        server.start();
        server.notify(file);
    });
});

//Default task
gulp.task('default', ['lint', 'scripts', 'watch', 'serve']);

var gulp = require('gulp');
browserify = require('browserify');
source = require('vinyl-source-stream');
buffer = require('vinyl-buffer');
var gulpLoadPlugins = require('gulp-load-plugins');
var plugins = gulpLoadPlugins();


/*
 * Tasks:
 * - gulp server:
 *   - start server on localhost AND watch JS files
 * - gulp watch:
 *   - watches JS files on the watch list
 *   - browserifys the files you chose to browserify when a watched file changes
 *   - watches SASS files
 * - gulp icons:
 *   - turns individual svg files into sprite
 *   - removes any unwanted attributes so styles can be added via stylesheet
 *   - creates titles and descriptions for icons with icon-titles.yaml file
 *   - suffixes icon IDs to prevent conflicts
 * - gulp styles:
 *   - takes scss file and makes an expanded and minified version of the file
 * - gulp images:
 *   - compresses images
 *   - uses caching to prevent previously compressed images from being compressed again
 */

// Define file path variables
var paths = {
  root: 'app/',      // App root path
  src:  'app/source/',   // Source path
  dist: 'app/dist/', // Distribution path
  test: 'test/',     // Test path
};

var files = {
  // SASS files we want to watch
  sassWatch: [paths.src + 'css/sass/*.scss'],
  // SASS files we want to compile
  sassCompile: [paths.src + 'css/sass/styles.scss'],
  // Files we want to watch
  jsWatch: [paths.src + 'js/custom.js'],
  //Files we want to Browserify
  jsBrowserify: [paths.src + 'js/app.js']
};

var liveReload = true;

gulp.task('server', ['watch'], function () {
  plugins.connect.server({
    root: paths.root,
    livereload: liveReload,
  });
});

var svgSpriteConfig = {
  mode: {
    symbol: {
      dest: '',
      sprite: 'icons.svg'
    }
  },
  shape: {
    // Titles and descriptions
    meta: paths.src + 'icons/icon-titles/icon-titles.yaml',
    // Add suffix to IDs
    id: {
      generator: '%s-icon'
    }
  }
};
 
gulp.task('icons', function () {
  return gulp.src(paths.src + 'icons/*.svg')
      .pipe(plugins.cheerio({
        run: function ($) {
            //remove fill attribute so we can set it in the css
            $('[fill]').removeAttr('fill'); 
        },
        parserOptions: { xmlMode: true }
    }))
    .pipe(plugins.svgSprite(svgSpriteConfig))
    .pipe(gulp.dest(paths.dist + 'icons/sprite'));
});

gulp.task('styles', function() {
    gulp.src(files.sassCompile)
        .pipe(plugins.sass().on('error', plugins.sass.logError))
        .pipe(gulp.dest(paths.dist + 'css'))
});

gulp.task('browserify', function() {

    var tasks = files.jsBrowserify.map(function(entry) {
    return browserify({ entries: [entry], debug: true })
        .bundle()
        .pipe(source('app.js')) //change this parameter to the entry variable to create multiple streams
        //uncomment following line if you want to minify
        //.pipe(plugins.streamify(plugins.uglify({mangle: false})))
        .pipe(plugins.rename({
            extname: '.bundle.js'
        }))
        .pipe(buffer())
        // optional, remove if you don't want sourcemaps
        .pipe(plugins.sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(plugins.sourcemaps.write('./')) // writes .map file
        // rename them to have "bundle as postfix"
        .pipe(gulp.dest(paths.dist + 'js'));
    });
});

gulp.task('images', function() {
  return gulp.src(paths.src + 'images/**')
    .pipe(plugins.cache(plugins.imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
    .pipe(gulp.dest(paths.dist + 'images'))
    .pipe(plugins.notify({ message: 'Images task complete' }));
});

gulp.task('watch', function () {

  gulp.watch(files.sassWatch,['styles']);
  gulp.watch(files.jsWatch,['browserify']);

});


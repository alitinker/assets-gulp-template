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
 * - gulp icons:
 *   - turns individual svg files into sprite
 *   - removes any unwanted attributes so styles can be added via stylsheet
 *   - creates titles and descriptions for icons with icon-titles.yaml file
 *   - suffixes icon IDs to prevent conflicts
 * - gulp styles:
 *   - takes scss file and makes an expanded and minified version of the file
 * - gulp images:
 *   - compresses images
 *   - uses caching to prevent previously compressed images from being compressed again
 */

var liveReload = true;

gulp.task('server', ['watch'], function () {
  plugins.connect.server({
    root: '.',
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
    meta: 'assets/icons/icon-titles/icon-titles.yaml',
    // Add suffix to IDs
    id: {
      generator: '%s-icon'
    }
  }
};
 
gulp.task('icons', function () {
  return gulp.src('source/icons/*.svg')
      .pipe(plugins.cheerio({
        run: function ($) {
            //remove fill attribute so we can set it in the css
            $('[fill]').removeAttr('fill'); 
        },
        parserOptions: { xmlMode: true }
    }))
    .pipe(plugins.svgSprite(svgSpriteConfig))
    .pipe(gulp.dest('dist/icons/sprite'));
});

gulp.task('styles', function() {
  return plugins.rubySass('source/css/sass/screen.scss', { style: 'compressed', compass: true })
    .pipe(plugins.autoprefixer('last 2 version'))
    .pipe(plugins.dest('dist/css'))
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(plugins.cssnano())
    .pipe(gulp.dest('dist/css'))
    .pipe(plugins.notify({ message: 'Styles task complete' }));
});

gulp.task('images', function() {
  return gulp.src('source/images/**')
    .pipe(plugins.cache(plugins.imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist/images'))
    .pipe(plugins.notify({ message: 'Images task complete' }));
});

gulp.task('watch', function () {

  var files = {
    // Files we want to watch
    toWatch: ['source/js/custom.js'],
    //Files we want to Browserify
    toBrowserify: ['source/js/app.js']
  };

  gulp.watch(files.toWatch,function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');

    var tasks = files.toBrowserify.map(function(entry) {
        return browserify({ entries: [entry], debug: true })
            .bundle()
            .pipe(source(entry))
            .pipe(plugins.rename({
                extname: '.bundle.js'
            }))
            .pipe(buffer())
            // optional, remove if you dont want sourcemaps
            .pipe(plugins.sourcemaps.init({loadMaps: true})) // loads map from browserify file
            // Add transformation tasks to the pipeline here.
            .pipe(plugins.sourcemaps.write('./')) // writes .map file
            // rename them to have "bundle as postfix"
            .pipe(gulp.dest('dist/js'));
        });
  });
});


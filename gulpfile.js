'use strict';

var gulp = require('gulp'),
    htmlmini = require('gulp-html-minify'),
    useref = require('gulp-useref'),
    csso = require('gulp-csso'),
    filter = require('gulp-filter'),
    RevAll = require('gulp-rev-all');
var webpack = require('webpack-stream');
var webpackUglifyJs = require('uglifyjs-webpack-plugin');
var sass = require('gulp-sass');
var tildeImporter = require('node-sass-tilde-importer');
var browserSync = require('browser-sync');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var imagemin = require('gulp-imagemin');
var changed = require('gulp-changed');
var fontSpider=require('gulp-font-spider');
var fileinclude = require('gulp-file-include');
var del = require('del');
var sequence = require('run-sequence');
var pkg = require('./package.json');

var production = false;

var file = {
  html:   'src/**/*.html',
  scss:   'src/**/**/**/*.scss',
  js:     'src/assets/js/src/**/*.js',
}

var page = {
  js:     'src/assets/js/src/page.js',
  scss:   'src/assets/scss/style.scss',
}

var dir = {
  css:    'src/assets/css/',
  js:     'src/assets/js/',
  font:   'src/assets/fonts/',
}

var browsers = [
  'Chrome >= 45',
  'Firefox >= 40',
  'Edge >= 12',
  'Explorer >= 11',
  'iOS >= 9',
  'Safari >= 9',
  'Android 2.3',
  'Android >= 4',
  'Opera >= 30'
];


/*
|--------------------------------------------------------------------------
| Serve
|--------------------------------------------------------------------------
|
*/
gulp.task('reload', function() {
  browserSync.reload();
});

gulp.task('serve', ['sass','scss','testfont','fileinclude'], function() {
  browserSync({
    server: 'src/'
  });

  gulp.watch( file.scss, ['sass','scss'] );
  gulp.watch( file.js, function() {
    sequence('js', 'reload');
  });
  gulp.watch( file.html, ['reload','testfont','fileinclude-watch'] );
});

// font字体编译

gulp.task('testfont',function () {
  gulp.src(file.html)
  .pipe(fontSpider());
});


/*
|--------------------------------------------------------------------------
| SASS
|--------------------------------------------------------------------------
|
*/

gulp.task('scss', function () {
  // 老版官网样式编译
  var stream = gulp.src('src/portal/bowner/scss/*.scss')
    .pipe( sourcemaps.init() )
    .pipe( rename( { suffix: '.min' } ) )
    .pipe( sass({ importer: tildeImporter, outputStyle: 'compressed' }).on('error', sass.logError) )
    .pipe( autoprefixer({
      browsers: browsers
    }))
    .pipe( sourcemaps.write('.') )
    .pipe( gulp.dest('src/portal/bowner/css') )
    .pipe( browserSync.stream() );
});

gulp.task('sass', function() {

  var stream = gulp.src(page.scss)
    .pipe( sourcemaps.init() )
    .pipe( rename( { suffix: '.min' } ) )
    .pipe( sass({ importer: tildeImporter, outputStyle: 'compressed' }).on('error', sass.logError) )
    .pipe( autoprefixer({
      browsers: browsers
    }))
    .pipe( sourcemaps.write('.') )
    .pipe( gulp.dest(dir.css) )
    .pipe( browserSync.stream() );

  // Create unminified version if it's in production mode
  if ( production ) {
    stream = gulp.src(page.scss)
      .pipe( sourcemaps.init() )
      .pipe( sass({importer: tildeImporter}).on('error', sass.logError) )
      .pipe( autoprefixer({
        browsers: browsers
      }))
      .pipe( sourcemaps.write('.') )
      .pipe( gulp.dest(dir.css) );
  }

  return stream;

});



/*
|--------------------------------------------------------------------------
| JS
|--------------------------------------------------------------------------
|
*/
gulp.task('js', function() {
  var stream;

  if ( production ) {
    // stream = gulp.src(page.js)
    //   .pipe(webpack({
    //     mode: 'none',
    //     devtool: 'source-map',
    //     output: {
    //       filename: 'page.min.js'
    //     },
    //     plugins: [
    //       new webpackUglifyJs()
    //     ]
    //   }))
    //   .pipe( gulp.dest(dir.js) );

    stream = gulp.src(page.js)
      .pipe(webpack({
        mode: 'none',
        devtool: 'source-map',
        output: {
          filename: 'page.js'
        }
      }))
      .pipe( gulp.dest(dir.js) );
  }
  else {
    stream = gulp.src(page.js)
      .pipe(webpack({
        mode: 'none',
        devtool: 'source-map',
        output: {
          filename: 'page.min.js'
        }
      }))
      .pipe( gulp.dest(dir.js) );
  }

  return stream;
});


// 合并头部和内容在一个页面
gulp.task('fileinclude', function() {
  return gulp.src(['src/pages/**/*.html'])
  .pipe(fileinclude({
    prefix: '@@',
    basepath: '@file'
  }))
  .pipe(gulp.dest('src/portal')).pipe(browserSync.stream());
});

gulp.task('fileinclude-watch',['fileinclude'],browserSync.reload);

/*
|--------------------------------------------------------------------------
| Copy
|--------------------------------------------------------------------------
|
*/
gulp.task('copyFonts', function() {
  //gulp.src( 'node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/*').pipe(gulp.dest(dir.font));
  gulp.src( 'node_modules/font-awesome/fonts/*').pipe(gulp.dest(dir.font));
  gulp.src( 'node_modules/themify-icons/themify-icons/fonts/*').pipe(gulp.dest(dir.font));
  return gulp.src( 'node_modules/et-line/fonts/*').pipe(gulp.dest(dir.font));
});

gulp.task('distCopy', function() {
          gulp.src( ['src/**/*', '!src/assets/{js,plugin/thesaas,scss,css,img}{,/**}','!src/{portal,pages,index.html}{,/**/*}'] ).pipe(gulp.dest('dist/'));
          gulp.src( ['src/portal/bowner/**/**/*'] ).pipe(gulp.dest('dist/portal/bowner'));
          gulp.src( ['src/portal/dist/**/**/*'] ).pipe(gulp.dest('dist/portal/dist'));
          gulp.src( ['src/assets/img/**/*'] ).pipe(gulp.dest('dist/assets/img'));
  return  gulp.src( ['src/portal/**/img/*','src/portal/bowner.html'] ).pipe(gulp.dest('dist/portal'));
});


/*
|--------------------------------------------------------------------------
| Clean /dist directory
|--------------------------------------------------------------------------
|
*/
gulp.task('distClean', function() {
  return del('dist/');
});

/*
|--------------------------------------------------------------------------
| Img
|--------------------------------------------------------------------------
|
*/
gulp.task('img', function() {
  return gulp.src('src/assets/img/**/*.{jpg,jpeg,png,gif}')
    .pipe( imagemin() )
    .pipe( gulp.dest('src/assets/img/') );
});

/*
|--------------------------------------------------------------------------
| Tasks
|--------------------------------------------------------------------------
|
*/

gulp.task('compress', function () {
    var jsFilter = filter('src/**/*.js',{restore:true}),
        cssFilter = filter('src/**/*.css',{restore:true}),
        htmlFilter = filter('src/**/*.html',{restore:true});
    return gulp.src(['src/**/*', '!src/assets/{js/src,plugin/thesaas,scss,img,fonts}{,/**}','!src/portal/**/{img,index.scss}{,/*}','!src/pages/**/*','!src/portal/bowner/**/**/*','!src/portal/dist/bowner.html'])
        .pipe(useref())                         // 解析html中的构建块
        .pipe(jsFilter)                         // 过滤所有js
        .pipe(jsFilter.restore)
        .pipe(cssFilter)                        // 过滤所有css
        .pipe(csso())                           // 压缩优化css
        .pipe(cssFilter.restore)
        .pipe(RevAll.revision({                 // 生成版本号
            dontRenameFile: ['.html','.png','.jpg','.gif','script.js'],          // 不给 指定的 文件添加版本号
            dontUpdateReference: ['.html','.png','.jpg','.gif','script.js']      // 不给文件里链接的指定的后缀名加版本号
        }))
        .pipe(htmlFilter)                       // 过滤所有html
        .pipe(htmlmini())                       // 压缩html
        .pipe(htmlFilter.restore)
        .pipe(gulp.dest('dist/'))
})


gulp.task('del',function () {
    return del('dist/');                               // 构建前先删除dist文件里的旧版本
})

gulp.task('dist', function(cb) {
  production = true;
  sequence('distClean', 'compress', 'distCopy', cb);
});



// gulp.task('dev', function(cb) {
//   sequence('copyFonts', cb);
// });

gulp.task('watch', ['serve']);
gulp.task('default', ['serve']);

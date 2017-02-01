var gulp = require('gulp');
var path = require('path');
var plantuml = require('gulp-plantuml');
var webserver = require('gulp-webserver');
var print = require('gulp-print');
var tap = require('gulp-tap');
var exec = require('gulp-exec');
var ejs = require('gulp-ejs');
var rename = require('gulp-rename');
var cached = require('gulp-cached');
var plumber = require('gulp-plumber');
var fs = require('fs');

var _path = {
  src : './src',
  dst : './dst',
  ejs : './ejs'
};

gulp.task('webserver',function() {
  return gulp.src('./')
    .pipe(webserver({
      livereload: true,
      host: '0.0.0.0',
      port: '8000',
      open: true,
      directoryListing: true
    }));
});

gulp.task('ejs', function() {
  return gulp.src(_path.src+'/*.png')
    .pipe(cached('ejs'))
    .pipe(tap(function(file,t) {
      var img_file = path.basename(file.path);
      var img_name = img_file.split(/\.(?=[^.]+$)/)[0];
      console.log(img_name);
      gulp.src(["./ejs/index.html","!./ejs/*.ejs"])
        .pipe(ejs({
          img_file: img_file,
          img_name: img_name
        }))
        .pipe(rename(img_name+'.html'))
        .pipe(gulp.dest(_path.dst))
        .pipe(print(function(filepath) {
          return "ejs: " + filepath;
        }));
      gulp.src('./')
        .pipe(exec('echo > ./ejs/_error.ejs'));
    }));
});

gulp.task('plantuml', function() {
  return gulp.src(_path.src+'/*.pu')
  .pipe(cached('plantuml'))
  .pipe(plumber())
  .pipe(plantuml({
    jarPath: "/usr/bin/plantuml.jar"
  }))
  .on('error',function(error){
      console.log(error.message);
      gulp.src('./')
        .pipe(exec('echo "'+error.message+'" >> ./ejs/_error.ejs'));
      this.emit('end');
  })
  .pipe(gulp.dest(_path.dst))
  .pipe(print(function(filepath) {
    return "planted: " + filepath;
  }))
  .pipe(gulp.dest(_path.src))
  .pipe(print(function(filepath) {
    return "planted: " + filepath;
  }));
});

gulp.task('watch', function() {
  gulp.watch([_path.dst+'/*.png'],['ejs']);
  gulp.watch([_path.ejs+'/_error.ejs'],['ejs']);
  gulp.watch([_path.src+'/*.pu'],['plantuml']);
  gulp.src('gulpfile.js');
});

gulp.task('default', ['watch', 'webserver','plantuml','ejs']);

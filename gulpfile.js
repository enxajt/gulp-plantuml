const gulp = require('gulp');
const path = require('path');
const plantuml = require('gulp-plantuml');
const webserver = require('gulp-webserver');
const print = require('gulp-print');
const tap = require('gulp-tap');
const exec = require('gulp-exec');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const cached = require('gulp-cached');
const plumber = require('gulp-plumber');
const fs = require('fs');

const _path = {
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

//TODO ejs cut a common part 

gulp.task('ejs_error', function() {
  return gulp.src(_path.dst+'/*.png')
    .pipe(tap(function(file,t) {
      var img_file = path.basename(file.path);
      var img_name = img_file.split(/\.(?=[^.]+$)/)[0];
      console.log('ejs_error_before: '+img_file);
      gulp.src(["./ejs/index.html","!./ejs/*.ejs"])
        .pipe(ejs({
          img_file: img_file,
          img_name: img_name
        }))
        .pipe(rename(img_name+'.html'))
        .pipe(gulp.dest(_path.dst))
        .pipe(print(function(filepath) {
          return "ejs_error: " + filepath;
        }));
    }));
});

gulp.task('ejs_image', function() {
  return gulp.src(_path.dst+'/*.png')
    .pipe(cached('ejs'))
    .pipe(tap(function(file,t) {
      var img_file = path.basename(file.path);
      var img_name = img_file.split(/\.(?=[^.]+$)/)[0];
      console.log('before ejs: '+img_file);
      gulp.src(["./ejs/index.html","!./ejs/*.ejs"])
        .pipe(ejs({
          img_file: img_file,
          img_name: img_name
        }))
        .pipe(rename(img_name+'.html'))
        .pipe(gulp.dest(_path.dst))
        .pipe(print(function(filepath) {
          return "ejs_image: " + filepath;
        }));
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
    gulp.src('./')
      .pipe(exec('echo > ./ejs/_error.ejs'));
    return "planted: " + filepath;
  }));
});

gulp.task('watch', function() {
  gulp.watch([_path.dst+'/*.png'],['ejs_image']);
  gulp.watch([_path.ejs+'/_error.ejs'],['ejs_error']);
  gulp.watch([_path.src+'/*.pu'],['plantuml']);
  gulp.src('gulpfile.js');
});

gulp.task('default', ['watch', 'webserver','plantuml','ejs_image']);

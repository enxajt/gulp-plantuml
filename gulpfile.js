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
var jsonTransform = require('gulp-json-transform');
var through = require('through2');

var _path = {
	src : './src',
	dst : './dst',
	_var : './ejs/var',
	last : './ejs/var'+'/last.json',
	_error : './ejs/var'+'/_error.ejs'
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
  var pages = JSON.parse(fs.readFileSync(_path._var+"/pages.json")).pages;
  for (var i=0; i<pages.length; i++) {
    return gulp.src([
        "./ejs/**/*.ejs",
        "!./ejs/template/*.ejs"])
      .pipe(ejs({
	      jsonData: pages[i]
      }))
      .pipe(rename(pages[i].id+'.html'))
      .pipe(gulp.dest(_path.dst));
  } 
});

gulp.task('pages', function() {
  var imgs=[];
  gulp.src(_path.dst+'/*.png')
    .pipe(print(function(filepath){
      return "test: " + filepath;
      imgs.push(filepath);
    }));
    gulp.src(_path.dst+'/*.png')
      .pipe(print());
  var allPages = JSON.stringify(imgs);
  gulp.src(_path._var+"/pages.json")
        .pipe(jsonTransform(function(data, file) {
  	  return allPages;
        }))
});

gulp.task('img', function() {
  return gulp.src(_path.src+'/*.png')
    .pipe(cached('img'))
    .pipe(tap(function(file, t) {
      var img_name = path.basename(file.path);
      gulp.src(_path.last)
        .pipe(jsonTransform(function(data, file) {
  	  return {
		id: img_name,
		title: img_name,
  	  	img: img_name
  	  };
        }))
        .pipe(gulp.dest(_path._var));
      gulp.src('./')
        .pipe(exec('echo > ./ejs/var/_error.ejs'));
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
      console.log('XXX: '+error.message);
      gulp.src('./')
        .pipe(exec('echo "'+error.message+'" >> ./ejs/var/_error.ejs'));
      this.emit('end');
  })
  .pipe(gulp.dest(_path.dst))
  .pipe(gulp.dest(_path.src))
  .pipe(print(function(filepath) {
  	return "planted: " + filepath;
  }));
});

gulp.task('watch', function() {
//	gulp.watch([_path.last],['last']);
	gulp.watch([_path.dst+'/*.png'],['img']);
	gulp.watch(['./ejs/var/_error.ejs'],['pages']);
	gulp.watch([_path.src+'/*.pu'],['plantuml']);
	gulp.src('gulpfile.js');
});

gulp.task('default', ['watch', 'webserver','plantuml','pages','ejs']);

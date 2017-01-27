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
var notify = require('gulp-notify');

var _path = {
	src : './src',
	dst : './dst',
	_var : './ejs/var',
	last : './ejs/var'+'/last.json'
};

gulp.task('webserver',function() {
  gulp.src('./')
    .pipe(webserver({
      livereload: true,
      host: '0.0.0.0',
      port: '8000',
      open: true,
      directoryListing: true
    }));
});

gulp.task('last', function() {
  var last = JSON.parse(fs.readFileSync(_path.last));
  gulp.src([
      "./ejs/**/*.ejs",
      "!./ejs/template/*.ejs",
      "!./ejs/var/*.json"])
      .pipe(ejs({
	      jsonData: last 
      }))
    .pipe(rename('last.html'))
    .pipe(gulp.dest(_path.dst));
});

gulp.task('all', function() {
  var pages = JSON.parse(fs.readFileSync(_path._var+"/pages.json")).pages;
  for (var i=0; i<pages.length; i++) {
    console.log(pages[i]);
    gulp.src([
        "./ejs/**/*.ejs",
        "!./ejs/template/*.ejs",
        "!./ejs/var/*.json"])
      .pipe(ejs({
	      jsonData: pages[i]
      }))
      .pipe(rename(pages[i].id+'.html'))
      .pipe(gulp.dest(_path.dst));
  } 
});

gulp.task('img', function() {
  gulp.src(_path.src+'/*.png')
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
    }));
});

gulp.task('plantuml', function() {
	gulp.src(_path.src+'/*.pu')
	.pipe(cached('plantuml'))
	//.pipe(plumber())
	.pipe(plantuml({
		jarPath: "/usr/bin/plantuml.jar"
	}))
	.pipe(gulp.dest(_path.dst))
	.pipe(gulp.dest(_path.src))
	.pipe(print(function(filepath) {
		return "planted: " + filepath;
	}));
});

gulp.task('watch', function() {
	gulp.watch([_path.last],['last']);
	gulp.watch([_path.dst+'/*.png'],['img']);
	gulp.watch([_path.src+'/*.pu'],['plantuml']);
	gulp.src('gulpfile.js');
});

gulp.task('default', ['watch', 'webserver','plantuml','all']);

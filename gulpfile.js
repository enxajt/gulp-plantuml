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

var _path = {
	src : './src',
	dst : './dst',
	_var : './ejs/var',
	index : './ejs/var'+'/index.json'
};

gulp.task('webserver',function() {
  gulp.src(_path.dst)
    .pipe(webserver({
      livereload: true,
      host: '0.0.0.0',
      port: '8000',
      open: true,
      directoryListing: true
    }));
});

gulp.task('ejs', function() {
	var json = JSON.parse(fs.readFileSync(_path.index));
	gulp.src(["./ejs/**/*.ejs","!./ejs/template/*.ejs","!./ejs/var/*.json"])
	.pipe(plumber())
	.pipe(ejs(json))
	.pipe(rename({extname: '.html'}))
	.pipe(gulp.dest(_path.dst))
	.pipe(print(function(filepath) {
		return "ejs: " + filepath;
	}));
});

gulp.task('img', function() {
	gulp.src(_path.src+'/*.png')
	  .pipe(cached('img'))
	  .pipe(plumber())
	  .pipe(tap(function(file, t) {
	    var img_name = path.basename(file.path);
	    gulp.src(_path.index)
	      .pipe(jsonTransform(function(data, file) {
		return {
			imgName: img_name 
		};
              }))
	      .pipe(gulp.dest(_path._var));
	      return 'imgName: '+file.path;
	  }));
});

gulp.task('plantuml', function() {
	gulp.src(_path.src+'/*.pu')
	.pipe(cached('plantuml'))
	.pipe(plumber())
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
	gulp.watch([_path.index],['ejs']);
	gulp.watch([_path.dst+'/*.png'],['img']);
	gulp.watch([_path.src+'/*.pu'],['plantuml']);
	gulp.src('gulpfile.js');
});

gulp.task('default', ['watch', 'webserver']);

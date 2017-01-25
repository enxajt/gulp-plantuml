var gulp = require('gulp');
var path = require('path');
var plantuml = require('gulp-plantuml');
var webserver = require('gulp-webserver');
var print = require('gulp-print');
var exec = require('gulp-exec');
var ejs = require('gulp-ejs');
var rename = require('gulp-rename');
var cached = require('gulp-cached');
var plumber = require('gulp-plumber');
var fs = require('fs');
var jsonTransform = require('gulp-json-transform');

var _path = {
	src : './src',
	dst : './dst'
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
	var json = JSON.parse(fs.readFileSync("./index.json"));
	gulp.src(["./src/ejs/**/*.ejs","!./src/ejs/template/*.ejs"])
	.pipe(plumber())
	.pipe(ejs(json))
	.pipe(rename({extname: '.html'}))
	.pipe(gulp.dest(_path.dst))
	.pipe(print(function(filepath) {
		return "ejs: " + filepath;
	}));
});

gulp.task('plantuml', function() {
	gulp.src('./src/*.pu')
	.pipe(cached('plantuml'))
	.pipe(plantuml({
		jarPath: "/usr/bin/plantuml.jar"
	}))
	.pipe(gulp.dest(_path.dst))
	.pipe(print(function(filepath) {
		return "plant: " + filepath;
	}));
});

gulp.task('img', function() {
	gulp.src('./dst/*.png')
	  .pipe(cached('img'))
	  .pipe(print(function(filepath) {
	    var img_name = path.basename(filepath);
	    //img_name = img_name.replace('\.pu','');
	    console.log(img_name);
	    gulp.src('./')
	      //.pipe(exec("echo "+img_name+" > src/ejs/template/_uml.ejs"));
	      gulp.src('./index.json')
	      .pipe(jsonTransform(function(data, file) {
		return {
			imgName: img_name 
		};
              }))
	      .pipe(gulp.dest('./'));
	  }));
});

gulp.task('watch', function() {
	gulp.watch(['./src/*.pu'],['plantuml','img', 'ejs']);
	gulp.watch(['./src/ejs/**/*.ejs'],['ejs']);
	gulp.src('gulpfile.js');
});

gulp.task('default', ['plantuml', 'watch', 'webserver', 'ejs']);

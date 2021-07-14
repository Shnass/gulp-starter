const gulp = require("gulp");
const gulpPug = require("gulp-pug");
const gulpSass = require("gulp-sass")(require('sass'));
const gulpPlumber = require("gulp-plumber");
const gulpAutoprefixer = require("gulp-autoprefixer");
const gulpCleanCss = require("gulp-clean-css");
const gulpBabel = require("gulp-babel");
const gulpImagemin = require("gulp-imagemin");
const gulpUglify = require("gulp-uglify");
const bs = require("browser-sync");
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

function pug2html() {
	return gulp.src('dev/pug/pages/*.pug')
		.pipe(gulpPlumber())
		.pipe(gulpPug({
			pretty:true
		}))
		.pipe(gulpPlumber.stop())
		.pipe(gulp.dest('dist'))
}

function scss2css() {
	return gulp.src('dev/static/styles/main.scss')
		.pipe(gulpPlumber())
		.pipe(gulpSass())
		.pipe(gulpAutoprefixer())
		.pipe(gulpCleanCss({
			level: 2
		}))
		.pipe(gulpPlumber.stop())
		.pipe(bs.stream())
		.pipe(gulp.dest('dist/static/css/'))
}

function script() {
	return gulp.src('dev/static/js/main.js')
		.pipe(gulpBabel({
			presets: ['@babel/env']
		}))
		.pipe(gulpUglify())
		.pipe(bs.stream())
		.pipe(gulp.dest('dist/static/js/'))
}

function fonts() {
	return gulp.src('dev/static/fonts/**/*.*')
		.pipe(bs.stream())
		.pipe(gulp.dest('dist/static/fonts/'))
}


function imageMin(){
	return gulp.src([
		'dev/static/images/**/*.{jpg,png,gif,svg}',
		'!dev/static/images/sprite/*',
		])
		.pipe(gulpImagemin([
		gulpImagemin.gifsicle({interlaced: true}),
		gulpImagemin.mozjpeg({quality: 75, progressive: true}),
		gulpImagemin.optipng({optimizationLevel: 5}),
		gulpImagemin.svgo({
			plugins: [
				{removeViewBox: true},
				{cleanupIDs: false}
			]
		})]))
		.pipe(gulp.dest('dist/static/images/'))
}

function svgSpriteBuild(){
	return gulp.src('dev/static/images/sprite/*.svg')
	// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill, style and stroke declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		// cheerio plugin create unnecessary string '&gt;', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: "sprite.svg",
				}
			}
		}))
		.pipe(gulp.dest('dist/static/images/sprite/'));
};

function watch() {
	bs.init({
		server:{
			baseDir: 'dist'
		}
	})

	gulp.watch("dev/static/styles/**/*.scss", scss2css).on('change', bs.reload);
	gulp.watch(['dev/static/images/**/*.{jpg,png,gif,svg}','!dev/static/images/sprite/*'], imageMin).on('change', bs.reload);
	gulp.watch("dev/static/images/sprite/", svgSpriteBuild).on('change', bs.reload);
	gulp.watch("dev/static/js/**/*.js", script).on('change', bs.reload);
	gulp.watch("dev/static/fonts/**/*.*", fonts).on('change', bs.reload);
	gulp.watch("dev/pug/**/*.pug", pug2html).on('change', bs.reload);
}

function clean() {
	// TODO 
	
}

exports.default = gulp.series(pug2html, scss2css, script, imageMin, watch, fonts)
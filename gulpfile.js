const gulp = require('gulp');
const sass = require('gulp-sass'); // sassコンパイル
const postcss = require('gulp-postcss'); // ベンダープリフェックスを自動で付与
const cssdeclsort = require('css-declaration-sorter'); // cssのプロパティをアルファベット順に並べ替え
const cleanCSS = require('gulp-clean-css'); // cssを圧縮

const uglify = require('gulp-uglify'); // jsを圧縮

const imagemin = require('gulp-imagemin'); // 画像を圧縮
const pngquant = require('imagemin-pngquant'); // pngを圧縮
const mozjpeg = require('imagemin-mozjpeg'); // jpegを圧縮

const rename = require('gulp-rename'); // コンパイル先のファイル名を変更
const plumber = require('gulp-plumber'); // エラー時の強制終了を防止
const notify = require('gulp-notify'); // エラー発生時にデスクトップ通知する
const sassGlob = require('gulp-sass-glob'); // @importの記述を簡潔にする
const browserSync = require( 'browser-sync' ); // ブラウザ監視

const env = require('node-env-file'); // 環境変数読み込み

// .env読み込み
env('.env');

// .evnからテーマ名を取得
const url = './wordpress/wp-content/themes/' + process.env.THEME_NAME;
// .envからポート番号を取得
const port = process.env.NGINX_HOST_PORT_80;

// scssのコンパイル
gulp.task('sass', function (done) {
	gulp.src( url + '/sass/*.scss' )
	.pipe( plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }) ) // エラーチェック
	.pipe( sassGlob() ) // importの読み込みを簡潔にする
	// expanded, nested, campact, compressedからcssの出力方法を選択
	// https://qiita.com/39_isao/items/b5de3343b3289bceeb88
	.pipe( sass({
		outputStyle: 'expanded'
	}) )
	.pipe( postcss([ cssdeclsort({ order: 'alphabetically' }) ]) ) // プロパティをソートし直す(アルファベット順)
	.pipe( gulp.dest( url + '/css') )
	.pipe( gulp.dest( url ) )
	.pipe( notify('sassをコンパイルしました！') )
	.pipe( cleanCSS({ compatibility: 'ie8' }) ) // css圧縮
	.pipe( rename({ extname: '.min.css' }) ) // 名前を変更
	.pipe( gulp.dest( url + '/css') )
	.pipe( notify('cssを圧縮しました！') );
	done();
});

// jsの圧縮
gulp.task('js', function (done) {
	gulp.src( url + '/js/*.js' )
	.pipe( uglify() )
	.pipe( rename({ extname: '.min.js' }) )
	.pipe( gulp.dest( url + '/js/dist') )
	.pipe( notify('jsを圧縮しました！') );
	done();
})

// 画像の圧縮
// 圧縮率の定義
const imageminOption = [
	pngquant({ quality: [.7, .85], }),
	mozjpeg({ quality: 85 }),
	imagemin.gifsicle({
		interlaced: false,
		optimizationLevel: 1,
		colors: 256
	}),
	imagemin.jpegtran(),
	imagemin.optipng(),
	imagemin.svgo()
];

// $ gulp imageminで./src/images/base/フォルダ内の画像を圧縮し./src/img/フォルダへ
// npm run gulp imagemin
gulp.task('imagemin', function (done) {
	gulp.src( url + '/images/base/*.{png,jpg,jpeg,gif,svg}' )
	.pipe( imagemin(imageminOption) )
	.pipe( gulp.dest( url + '/images') );
	done();
});

// 保存時のリロード
gulp.task( 'browser-sync', function (done) {
	browserSync.init({
		proxy: "localhost:" + port
	});
	done();
});
gulp.task( 'bs-reload', function(done) {
	browserSync.reload();
	done();
});

// 監視
gulp.task( 'watch', function (done) {
	gulp.watch( url + '/sass/**/*.scss', gulp.task('sass') ); // sassが更新されたらsassをコンパイル
	gulp.watch( url + '/css/*.css', gulp.task('bs-reload')); // cssが更新されたらブラウザをリロード
	gulp.watch( url + '/js/*.js', gulp.task('js') ); // jsが更新されたらjsを圧縮
	gulp.watch( url + '/js/dist/*.js', gulp.task('bs-reload') ); // jsが更新されたらブラウザをリロード
	gulp.watch( url + '/**/*.php', gulp.task('bs-reload') ); // phpが更新されたらブラウザをリロード
	gulp.watch( url + '/**/*.html', gulp.task('bs-reload') ); // htmlが更新されたらブラウザをリロード
});

// default
// npm run gulpした時のタスク
gulp.task('default', gulp.series(gulp.parallel('browser-sync', 'watch')));
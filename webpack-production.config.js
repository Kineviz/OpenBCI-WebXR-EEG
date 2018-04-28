const webpack = require('webpack');
const { resolve } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = require('./server/config.js');

module.exports = {
	context: resolve(__dirname, 'src'),
	entry: [
		'./index.jsx',
		// the entry point of our app
	],
	output: {
		filename: 'bundle.js',
		// the output bundle

		path: resolve(__dirname, 'dist'),

		publicPath: '/'
		// necessary for HMR to know where to load the hot update chunks
	},
	module: {
		rules: [

			{
				test: /\.(js|jsx)$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['env']
					}
				}
			},
			{
			  test: /\.css$/,
			  loader: 'style-loader'
			}, {
			  test: /\.css$/,
			  loader: 'css-loader'
			},
			{
				test: /\.(eot|ttf|woff|woff2)$/,
				loader: 'file-loader?name=fonts/[name].[ext]'
			},
			{
				test: /\.obj$/,
        loader: 'webpack-obj-loader'
			},
			{
				test: /\.(jpe?g|gif|svg)$/i,
				use: [
					'url-loader?name=images/[name].[ext]&limit=10000',
					'img-loader?name=images/[name].[ext]'
				]
			},
			{
				test: /\.(png)$/i,
				use: [
					'base64-image-loader'
				]
			},
      {
          test: /\.glsl$/,
          loader: 'webpack-glsl-loader'
      },
		],
	},
	resolve: {
		extensions: ['.js', '.jsx', '.css']
	},
	plugins: [
		new CopyWebpackPlugin([
      {
        from: resolve(__dirname, config.copy.html.src),
        to: resolve(__dirname, config.copy.html.dest),
      },
      {
        from: resolve(__dirname, config.copy.fonts.src),
        to: resolve(__dirname, config.copy.fonts.dest),
      },
      {
        from: resolve(__dirname, config.copy.images.src),
        to: resolve(__dirname, config.copy.images.dest),
      },
      {
        from: resolve(__dirname, config.copy.models.src),
        to: resolve(__dirname, config.copy.models.dest),
      },
      {
        from: resolve(__dirname, config.copy.textures.src),
        to: resolve(__dirname, config.copy.textures.dest),
      },
    ]),
		new webpack.ProvidePlugin({
      Rx: 'rxjs/Rx',
      _: 'lodash',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      THREE: 'three',
      'window.THREE': 'three',
    }),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js',
      minChunks: (module) => {
        // this assumes your vendor imports exist in the node_modules directory
        return module.context && module.context.indexOf('node_modules') !== -1;
      },
    }),
		new webpack.DefinePlugin({
		  'process.env': {
		    NODE_ENV: JSON.stringify('production')
		  }
		}),
		new webpack.LoaderOptionsPlugin({
		  minimize: true,
		  debug: false
		}),
		new webpack.optimize.UglifyJsPlugin({
		  beautify: false,
		  mangle: {
		    screw_ie8: false,
		    keep_fnames: true
		  },
		  compress: {
		    screw_ie8: false
		  },
		  comments: false
		})
	]
}

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require('webpack');
require('dotenv').config({ path: './.env' });


module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? "production" : "development",
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction ? "[name].[contenthash].js" : "bundle.js",
      publicPath: "/",
      clean: true, // Clean dist folder on each build
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    optimization: isProduction ? {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    } : {},
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        filename: "./index.html",
      }),
      new webpack.EnvironmentPlugin([
        'REACT_APP_FIREBASE_API_KEY',
        'REACT_APP_FIREBASE_AUTH_DOMAIN',
        'REACT_APP_FIREBASE_PROJECT_ID',
        'REACT_APP_FIREBASE_STORAGE_BUCKET',
        'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
        'REACT_APP_FIREBASE_APP_ID',
        'REACT_APP_FIREBASE_MEASUREMENT_ID'
      ]),
      // I also need to expose NODE_ENV to the application code for firebase.js
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
      })
    ],
    devServer: {
      static: [
        { directory: path.join(__dirname, "dist") },
        { directory: path.join(__dirname, "public") },
      ],
      compress: true,
      port: 3000, // Changed from 8080 to avoid conflict with Firestore emulator
      open: true,
      historyApiFallback: true,
    },
    performance: {
      hints: isProduction ? "warning" : false,
      maxAssetSize: 500000,
      maxEntrypointSize: 500000,
    },
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
  };
};
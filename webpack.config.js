const path = require('path');

export const entry = './src/main/js/app.js';
export const devtool = 'sourcemaps';
export const cache = true;
export const mode = 'development';
export const output = {
    path: __dirname,
    filename: './src/main/resources/static/built/bundle.js'
};
export const module = {
    rules: [
        {
            test: join(__dirname, '.'),
            exclude: /(node_modules)/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"]
                }
            }]
        }
    ]
};
const BootloaderPlugin = require("./bootloader-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    webpack: {
        plugins: [
            new BootloaderPlugin(HtmlWebpackPlugin, {script: './src/bootloader/tag-bootloader.ts'})
        ]
    }
}
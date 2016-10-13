'use strict';

const fs = require('fs');
const path = require('path');
const svgo = new (require('svgo'))({
    plugins: [
        {removeDimensions: true},
        {removeAttrs: {
            attrs: '*:(fill|stroke|id)'
        }}
    ]
});

const cache = {
    fileNames: []
};

function SVGOBuilder (iconDir, templatePath) {
    this.iconDir = iconDir;
    this.templatePath = templatePath;
}

SVGOBuilder.prototype.apply = function (compiler) {
    let iconDir = this.iconDir;
    let templatePath = this.templatePath;

    compiler.plugin('emit', function (compilation, callback) {

        fs.readdir(iconDir, function (error, fileNames) {
            fileNames = fileNames || [];
            if (cache.fileNames.join() === fileNames.join()) {
                return callback();
            }

            let font = '';

            Promise.all(fileNames.map(fileName => {
                let filePath = path.join(iconDir, fileName);

                return new Promise((resolve, reject) => {

                    fs.readFile(filePath, 'utf8', function (error, fileContent) {
                        if (error) {
                            return reject(error);
                        }

                        svgo.optimize(fileContent, result => {
                            let iconId = path.basename(filePath, path.extname(filePath));

                            if (result.error) {
                                return reject(result.error);
                            }

                            font += result.data.replace('<svg', '<svg id="icon-' + iconId + '"') + '\n\n';
                            resolve();
                        });
                    });

                });
            })).then(function () {
                fs.writeFile(templatePath, font, function (error) {
                    cache.fileNames = fileNames;
                    callback(error);
                });
            }).catch(function (error) {
                cache.fileNames = [];
                fs.writeFile(templatePath, error.stack);
                callback(error);
            });

        });

    });
}

module.exports = SVGOBuilder;

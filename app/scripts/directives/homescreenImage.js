angular.module('webwalletApp')
.directive('homescreenimage', function($q) {
    'use strict';

    var URL = window.URL || window.webkitURL;

    var getCanvas = function () {
        var canvasId = 'homescreen-canvas';
        var canvas = document.getElementById(canvasId);

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = canvasId;
            canvas.style.visibility = 'hidden';
            document.body.appendChild(canvas);
        }

        return canvas;
    };

    var processImage = function (origImage) {
        var height = 64;
        var width = 128;
        var quality = 0.7;
        var type = 'image/jpg';

        var canvas = getCanvas();
        canvas.width = width;
        canvas.height = height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(origImage, 0, 0, width, height);
        var imageData = ctx.getImageData(0,0, width, height);

        // Convert o B&W (not grayscale) using average
        for (var j=0; j<imageData.height; j++)
        {
            for (var i=0; i<imageData.width; i++)
            {
                var index=(j*4)*imageData.width+(i*4);
                var red=imageData.data[index];
                var green=imageData.data[index+1];
                var blue=imageData.data[index+2];
                var average=(red+green+blue)/3;
                var color = 255;
                if(average<128) { //force B&W, not grayscale
                    color = 0;
                }
                imageData.data[index] = color;
                imageData.data[index+1] = color;
                imageData.data[index+2] = color;
                imageData.data[index+3] = 255;
            }
        }
        ctx.putImageData(imageData,0,0,0,0, imageData.width,   imageData.height);
        return canvas.toDataURL(type, quality);
    };

    var createImage = function(url, callback) {
        var image = new Image();
        image.onload = function() {
            callback(image);
        };
        image.src = url;
    };

    var fileToDataURL = function (file) {
        var deferred = $q.defer();
        var reader = new FileReader();
        reader.onload = function (e) {
            deferred.resolve(e.target.result);
        };
        reader.readAsDataURL(file);
        return deferred.promise;
    };


    return {
        restrict: 'A',
        scope: {
            homescreenimage: '='
        },
        link: function postLink(scope, element, attrs) {

            var doProcess = function(imageResult, callback) {
                createImage(imageResult.url, function(image) {
                    var dataURL = processImage(image);
                    imageResult.preview = {
                        dataURL: dataURL,
                        type: dataURL.match(/:(.+\/.+);/)[1]
                    };
                    callback(imageResult);
                });
            };

            var applyScope = function(imageResult) {
                scope.$apply(function() {
                    scope.homescreenimage = imageResult;
                });
            };


            element.bind('change', function (evt) {

                var files = evt.target.files;
                for(var i = 0; i < files.length; i++) {
                    var imageResult = {
                        file: files[i],
                        url: URL.createObjectURL(files[i])
                    };

                    fileToDataURL(files[i]).then(function (dataURL) {
                        imageResult.dataURL = dataURL;
                    });


                    doProcess(imageResult, function(imageResult) {
                        applyScope(imageResult);
                    });
                }
            });
        }
    };
});
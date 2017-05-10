const fs        = require('fs');
const mysql     = require('mysql');
const aws       = require('aws-sdk');
const crypto    = require('crypto');
const request   = require('request').defaults({ encoding: null });
const sharp     = require('sharp');
const coid      = 102;

var thumbsUrls  = fs.readFileSync('tmp/prod/errors/create-thumbnails-fetch-error')
                    .toString()
                    .split('\n')
                    .map(_ => JSON.parse(_));


var t = new Date().getTime();

var s3 = new aws.S3();

function uploadImage(){

    if(thumbsUrls.length == 0) {

        console.log('batch processing completed | ', new Date().getTime());
        return;
    }

    var urlObj = thumbsUrls.shift();

    console.log( 'Will upload ', urlObj, ' to S3 bucket');

    request.get(urlObj.url, (error, response, body) => {
        if (!error && response.statusCode == 200) {

            var hash = crypto.createHash('sha1').update(body).digest('hex');

            var targetPath = "/" + [coid,
                    hash.substring(0, 2),
                    hash.substring(2, 4),
                    hash.substring(4, 10)].join('/') + "_192x108.jpg";

            console.log( 'targetPath -> ', targetPath);

            urlObj.sha1 = hash.substring(0, 255);
            urlObj.s3Path = targetPath;

            // --> Resize
            sharp(body)
                .resize(192, 108, {
                    kernel: sharp.kernel.lanczos2,
                    interpolator: sharp.interpolator.nohalo
                })
                .toBuffer((err, outputBuffer) => {
                    if (err) {
                        fs.appendFile("tmp/prod/rerun/errors/create-thumbnails-failure-payload",
                            JSON.stringify(urlObj) + ' -> ' + JSON.stringify( err.stack ) + '\n',
                            (error) => { if(error) console.log(error) });

                        uploadImage();
                        return;
                    }

                    var base64data  = new Buffer(outputBuffer, 'binary');
                    var path        = 'thumbnails' + targetPath;

                    s3.putObject({ // --> to S3
                        Bucket      : 'streamhub-static-content',
                        Key         : path,
                        Body        : base64data,
                        ACL         : 'public-read-write',
                        ContentType : 'image/jpg'
                    },function (error, data) {

                        if(error){
                            fs.appendFile("tmp/prod/rerun/errors/create-thumbnails-failure-payload",
                                JSON.stringify(urlObj) + ' -> ' + JSON.stringify( error.stack ) + '\n',
                                (error) => { if(error) console.log(error) });
                        }
                        else {
                            fs.appendFile("tmp/prod/create-thumbnails-success-payload",
                                JSON.stringify( urlObj ) + '\n',
                                (error) => { if(error) console.log(error) });
                        }

                        uploadImage();
                    });
                });

        }
        else {
            console.log( 'error while fetching ', urlObj.url );

            fs.appendFile("tmp/prod/rerun/errors/create-thumbnails-fetch-error",
                JSON.stringify( urlObj ) + '\n',
                (error) => { if(error) console.log(error) });

            uploadImage();
        }
    });
}

uploadImage();








const fs        = require('fs');
const mysql     = require('mysql');
const aws       = require('aws-sdk');
const crypto    = require('crypto');
const request   = require('request').defaults({ encoding: null });
const sharp     = require('sharp');

var coid = 102;

var series2thumbs =
    new Map(fs.readFileSync('tmp/prod/series-2-thumbnails-inter2inter').toString().split('\n').map(_ => _.split(";")));

var seriesInt2Ext =
    new Map(fs.readFileSync('tmp/prod/series-ext2int').toString().split('\n').map(_ => _.split(";").reverse()));


var thumbsUrls = [ ];
series2thumbs.forEach( (thumbnailInternalId, seriesInternalId) => {

    let seriesExtId = seriesInt2Ext.get( seriesInternalId );
    let url =
        'http://image5-a.beetv.jp/basic/img/title/<seriesExtId>_h_zap.jpg'.replace('<seriesExtId>', seriesExtId);

    thumbsUrls.push( {  url: url,
                        fileName: [ seriesExtId, '_h_zap.jpg' ].join(''),
                        seriesInternalId: seriesInternalId,
                        seriesExtId: seriesExtId,
                        thumbnailInternalId: thumbnailInternalId } );
});

thumbsUrls = thumbsUrls.slice(0, thumbsUrls.length);


var t = new Date().getTime();
console.log( 'start batch at | ', t);

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
                        fs.appendFile("tmp/prod/errors/create-thumbnails-failure-payload",
                            JSON.stringify(urlObj) + ' -> ' + JSON.stringify( err.stack ) + '\n',
                            (error) => { if(error) console.log(error) });

                        uploadImage();
                        return;
                    }

                    var base64data  = new Buffer(outputBuffer, 'binary');
                    var path        = 'thumbnails' + targetPath;

                    s3.upload({ // --> to S3
                        Bucket      : 'streamhub-static-content',
                        Key         : path,
                        Body        : base64data,
                        ACL         : 'public-read-write',
                        ContentType : 'image/jpg'
                    },function (error, data) {

                        if(error){
                            fs.appendFile("tmp/prod/errors/create-thumbnails-failure-payload",
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

            fs.appendFile("tmp/prod/errors/create-thumbnails-fetch-error",
                JSON.stringify( urlObj ) + '\n',
                (error) => { if(error) console.log(error) });

            uploadImage();
        }
    });
}

uploadImage();




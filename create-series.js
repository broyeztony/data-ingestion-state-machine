const fs            = require('fs');
const md5           = require('md5');
const randomstring  = require("randomstring");
const mysql         = require('mysql');

var seriesExtId2Title =
    new Map(fs.readFileSync('files/series').toString().split('\n').map(_ => _.split(';')));

var seriesExtId2InternalId =
    new Map(fs.readFileSync('tmp/prod/series-ext2int').toString().split('\n').map(_ => _.split(';')));

var series2ThumbInternalId2InternalId =
    new Map(fs.readFileSync('tmp/prod/series-2-thumbnails-inter2inter').toString().split('\n').map(_ => _.split(';')));


var coid = 102;
var ln = seriesExtId2Title.size;
var seriesParallelData = [ ];
seriesExtId2Title.forEach( (title, externalId) => {

    let internalId = seriesExtId2InternalId.get(externalId);
    let internalThumbnailId = series2ThumbInternalId2InternalId.get(internalId);

    var series = {
        id              : internalId,
        inventoryId     : internalId,
        name            : title,
        thumbnailId     : 1,
        description     : '',
    };

    series.uniqueString = md5( [ coid, JSON.stringify( series ) ].join(':'));

    seriesParallelData.push( series );
});

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : 'streamhub.cecnqr7qmz1u.eu-west-1.rds.amazonaws.com',
    user            : 'admin',
    password        : 'StreamHub5',
    database        : 'sh_amssas'
});

console.log( 'will process ', seriesParallelData.length, ' series', new Date().getTime() );

var insertionCount = 0;

function createSeries(){

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log('pool.getConnection Error');
            return;
        }

        var seriesRow = seriesParallelData.shift();

        if(seriesRow == null){
            console.log( 'done -> ', new Date().getTime() );
            pool.end();
            return;
        }

        connection.query(
            "INSERT INTO Series SET ?",
            seriesRow,
            (error, result) => {
                if (error) {
                    fs.appendFile('tmp/prod/errors/create-series-errors', error.toString() + '\n', (error) => {} );
                }
                else {

                    insertionCount++;

                    if(insertionCount >= ln){
                        console.log( 'done -> ', new Date().getTime() );
                        pool.end();
                        return;
                    }

                    connection.release();
                }
            });
    });
}

var count = 0;
while ( count < ln ){
    createSeries();
    count++;
}







const fs        = require('fs');
const mysql     = require('mysql');
const aws       = require('aws-sdk');
const crypto    = require('crypto');
const request   = require('request').defaults({ encoding: null });
const sharp     = require('sharp');

var coid = 102;

var thumbnails = fs.readFileSync('tmp/prod/create-thumbnails-success-payload').toString().split('\n')
        .map(_ => JSON.parse(_));

var ln = thumbnails.length;

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : 'localhost',
    user            : 'root',
    password        : 'root',
    database        : 'local'
});

var parallelData = thumbnails.map( (_) => {

    return {
        thumbnailInternalId : _.thumbnailInternalId,
        seriesInternalId    : _.seriesInternalId
    };
});

function done(){
    console.log( 'done -> ', new Date().getTime() );
    pool.end();
}

var updatedSeries = [ ];

function updateSerieThumbnails(){

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log('pool.getConnection Error');
            return;
        }

        var update = parallelData.shift();

        if(update == null){
            done();
            return;
        }

        // console.log( "will create inventory -> ", inventory );

        connection.query(
            [   "UPDATE Series SET thumbnailId = ",
                update.thumbnailInternalId,
                " WHERE id = ",
                update.seriesInternalId
            ].join(''),
            (error, result) => {
                if (error) {
                    fs.appendFile(
                        "tmp/prod/errors/update-thumbnails-4-series",
                        JSON.stringify(error) + "\n",
                        (error) => {} );
                }
                else {
                    fs.appendFile(
                        "tmp/prod/update-thumbnails-4-series",
                        JSON.stringify(result) + "\n",
                        (error) => {} );

                    if(parallelData.length == 0){
                        done();
                    }

                    connection.release();
                }
            });
    });
}

var i = 0;
while ( i < ln ){
    updateSerieThumbnails();
    i++;
}


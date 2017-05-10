const fs        = require('fs');
const mysql     = require('mysql');
const aws       = require('aws-sdk');
const crypto    = require('crypto');
const request   = require('request').defaults({ encoding: null });
const sharp     = require('sharp');

var coid = 102;

var thumbnails      = fs.readFileSync('tmp/prod/create-thumbnails-success-payload')
                        .toString()
                        .split('\n')
                        .map(_ => JSON.parse(_));

var series2programs = fs.readFileSync('tmp/prod/series-2-programs-inter2inter').toString().split('\n')

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : 'localhost',
    user            : 'root',
    password        : 'root',
    database        : 'local'
});

var series2thumbnail = { };
var parallelData = thumbnails.map( (_) => {
    series2thumbnail[ _.seriesInternalId ] = _.thumbnailInternalId;
});

var program2thumbnail = series2programs
    .map( _ => {
        [seriesInternalId, programInternalId]   = _.split(';');
        let thumbnailId = series2thumbnail[ seriesInternalId ];
        return { programId: programInternalId, thumbnailId: thumbnailId };
    })
    .filter( _ => (_.thumbnailId != undefined) );

let ln = program2thumbnail.length;


function done(){
    console.log( 'done -> ', new Date().getTime() );
    pool.end();
}

var updatedPrograms = [ ];

function updateProgramThumbnail(){

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log('pool.getConnection Error');
            return;
        }

        var update = program2thumbnail.shift();

        if(update == null){
            done();
            return;
        }

        connection.query(
            [   "UPDATE Program SET thumbnailId = ",
                update.thumbnailId,
                " WHERE id = ",
                update.programId
            ].join(''),
            (error, result) => {
                if (error) {
                    fs.appendFile(
                        "tmp/prod/errors/update-thumbnails-4-programs",
                        JSON.stringify(error) + "\n",
                        (error) => {} );
                }
                else {
                    fs.appendFile(
                        "tmp/prod/update-thumbnails-4-programs",
                        JSON.stringify(result) + "\n",
                        (error) => {} );

                    if(program2thumbnail.length == 0){
                        done();
                    }

                    connection.release();
                }
            });
    });
}

var i = 0;
while ( i < ln ){
    updateProgramThumbnail();
    i++;
}

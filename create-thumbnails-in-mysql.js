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
console.log( 'thumbnails created in S3 | ', ln );

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : 'localhost',
    user            : 'root',
    password        : 'root',
    database        : 'local'
});


var parallelData = thumbnails.map( (_) => {

    return {
        id              : _.thumbnailInternalId,
        inventoryId     : _.thumbnailInternalId,
        sha1            : _.sha1,
        fileName        : _.fileName
    };
});


function done(){
    console.log( 'done -> ', new Date().getTime() );
    pool.end();
}

var insertedThumbnails = [ ];

function createThumbnails(){

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log('pool.getConnection Error');
            return;
        }

        var thumbnail = parallelData.shift();

        if(thumbnail == null){
            done();
            return;
        }

        // console.log( "will create inventory -> ", inventory );

        connection.query(
            "INSERT INTO Thumbnail SET ?",
            thumbnail,
            (error, result) => {
                if (error) console.log(error);
                else {

                    fs.appendFile(
                        "tmp/prod/mysql-thumbnail-entries",
                        result.insertId + "\n",
                        (error) => { if(error) console.log("could not save thumbnail entry.") } );

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
    createThumbnails();
    i++;
}

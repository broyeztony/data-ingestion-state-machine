const fs            = require('fs');
const md5           = require('md5');
const randomstring  = require("randomstring");
const mysql         = require('mysql');


var series2ProgramsInternalId2InternalId =
    fs.readFileSync('tmp/prod/series-2-programs-inter2inter').toString().split('\n');

var coid = 102;
var ln = series2ProgramsInternalId2InternalId.length;


var s2pParallelData = series2ProgramsInternalId2InternalId.map( _ => {

    let [seriesId, programId] = _.split(';');
    return {
        seriesId    : seriesId,
        programId   : programId,
        season      : 0,
        episode     : 0
    };
});

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : 'streamhub.cecnqr7qmz1u.eu-west-1.rds.amazonaws.com',
    user            : 'admin',
    password        : 'StreamHub5',
    database        : 'sh_amssas'
});


var insertionCount = 0;

function createS2P(){

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log('pool.getConnection Error');
            return;
        }

        var s2pRow = s2pParallelData.shift();

        if(s2pRow == null){
            console.log( 'done -> ', new Date().getTime() );
            pool.end();
            return;
        }

        connection.query(
            "INSERT INTO Series2Program SET ?",
            s2pRow,
            (error, result) => {
                if (error) {
                    fs.appendFile('tmp/prod/errors/create-s2p-errors', error.toString() + '\n', (error) => {} );
                }
                else {

                    insertionCount++;

                    console.log( 'insertion success | ', insertionCount );

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
    createS2P();
    count++;
}







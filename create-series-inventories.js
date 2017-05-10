const fs            = require('fs');
const randomstring  = require("randomstring");
const mysql         = require('mysql');

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : 'localhost',
    user            : 'root',
    password        : 'root',
    database        : 'local'
});

var coid                    = 102;
var t0                      = fs.readFileSync('files/series').toString().split( "\n" );
var targetSeriesToInsert    = t0.length;

var parallelData = t0.map( (_) => {

        var [ id, title ]       = _.split(";");
        var seriesInventoryObj  = {
            inventoryTypeId : 7,
            publicId        : randomstring.generate( 16 ),
            contentOwnerId  : coid,
            ready           : 1,
            published       : 1
        };

        return seriesInventoryObj;
    });

console.log( parallelData.length, new Date().getTime() );

function done(){
    console.log( 'done -> ', new Date().getTime() );
    pool.end();
}

var insertedIds = [ ];

function createSeriesInventory(){

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log('pool.getConnection Error');
            return;
        }

        var inventory = parallelData.shift();

        if(inventory == null){
            done();
            return;
        }

        // console.log( "will create inventory -> ", inventory );

        connection.query(
            "INSERT INTO Inventory SET ?",
            inventory,
            (error, result) => {
                if (error) console.log(error);
                else {
                    var inventoryId = result.insertId;

                    insertedIds.push( inventoryId );

                    fs.appendFile(
                        "tmp/prod/series-inventory-pool",
                        result.insertId + "\n",
                        (error) => { if(error) console.log("could not save series inventoryId.") } );

                    if(insertedIds.length == targetSeriesToInsert){
                        done();
                    }

                    connection.release();
                }
            });
    });

}

var i = 0;
while ( i < targetSeriesToInsert ){
    createSeriesInventory();
    i++;
}
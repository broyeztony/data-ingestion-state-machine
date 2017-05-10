const fs            = require('fs');
const randomstring  = require("randomstring");
const mysql         = require('mysql');


var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : 'streamhub.cecnqr7qmz1u.eu-west-1.rds.amazonaws.com',
    user            : 'admin',
    password        : 'StreamHub5',
    database        : 'sh_amssas'
});

var coid                    = 102;
var t0                      = fs.readFileSync('files/series').toString().split( "\n" );
var targetThumbnails2Insert = t0.length;

var parallelData = t0.map( (_) => {

        var thumbnailInventoryObj  = {
            inventoryTypeId : 3,
            publicId        : randomstring.generate( 16 ),
            contentOwnerId  : coid,
            ready           : 1,
            published       : 1
        };

        return thumbnailInventoryObj;
    });

console.log( parallelData.length, new Date().getTime() );

function done(){
    console.log( 'done -> ', new Date().getTime() );
    pool.end();
}

var insertedIds = [ ];

function createThumbnailsInventory(){

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
                        "tmp/prod/thumbnails-inventory-pool",
                        result.insertId + "\n",
                        (error) => { if(error) console.log("could not create thumbnail inventoryId.") } );

                    if(insertedIds.length == targetThumbnails2Insert){
                        done();
                    }

                    connection.release();
                }
            });
    });

}

var i = 0;
while ( i < targetThumbnails2Insert ){
    createThumbnailsInventory();
    i++;
}

console.log('after while loop -> ', new Date().getTime());



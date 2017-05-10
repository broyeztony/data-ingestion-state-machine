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

var coid                    = 101;
var t0                      = fs.readFileSync('files/program-titles').toString().split( "\n" );
var targetProgramsToInsert  = t0.length;

var parallelData = t0.map( (_) => {

        var [ id, title ]           = _.split("~");
        var programInventoryObj     = {
            inventoryTypeId : 1,
            publicId        : randomstring.generate( 16 ),
            contentOwnerId  : coid,
            ready           : 1,
            published       : 1
        };

        return programInventoryObj;
    });

console.log( parallelData.length, new Date().getTime() );

function done(){
    console.log( 'done -> ', new Date().getTime() );
    pool.end();
}

var insertedIds = [ ];

function createProgramsInventory(){

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

        connection.query(
            "INSERT INTO Inventory SET ?",
            inventory,
            (error, result) => {
                if (error) console.log(error);
                else {
                    var inventoryId = result.insertId;

                    insertedIds.push( inventoryId );

                    fs.appendFile(
                        "tmp/programs-inventory-pool",
                        result.insertId + "\n",
                        (error) => { if(error) console.log("could not create program inventoryId.") } );

                    if(insertedIds.length == targetProgramsToInsert){
                        done();
                    }

                    connection.release();
                }
            });
    });

}

var i = 0;
while ( i < targetProgramsToInsert ){
    createProgramsInventory();
    i++;
}
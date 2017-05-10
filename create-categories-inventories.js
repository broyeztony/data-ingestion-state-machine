const fs            = require('fs');
const randomstring  = require("randomstring");
const mysql         = require('mysql');


var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : '',
    user            : '',
    password        : '',
    database        : ''
});

var coid                        = 102;
var t0                          = fs.readFileSync('files/categories').toString().split( "\n" );
var targetCategoriesToInsert    = t0.length;

var parallelData = t0.map( (_) => {

    var [ id, category ]       = _.split(";");
    return {
        inventoryTypeId : 34,
        publicId        : randomstring.generate( 16 ),
        contentOwnerId  : coid,
        ready           : 1,
        published       : 1
    };
});

console.log( parallelData.length, new Date().getTime() );

function done(){
    console.log( 'done -> ', new Date().getTime() );
    pool.end();
}

var insertedIds = [ ];

function createCategoriesInventory(){

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
                        "tmp/prod/category-inventory-pool",
                        result.insertId + "\n",
                        (error) => { if(error) console.log("could not save category inventoryId.") } );

                    if(insertedIds.length == targetCategoriesToInsert){
                        done();
                    }

                    connection.release();
                }
            });
    });

}

var i = 0;
while ( i < targetCategoriesToInsert ){
    createCategoriesInventory();
    i++;
}

console.log('here we are done -> ', new Date().getTime());









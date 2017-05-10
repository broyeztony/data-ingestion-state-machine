const fs            = require('fs');
const mysql         = require('mysql');


var connectionLocal = mysql.createConnection({
    host            : 'localhost',
    user            : 'root',
    password        : 'root',
    database        : 'local'
});

var connection = connectionLocal;
connection.connect();

function terminate( error ){
    if(error) console.log(error);
    connection.end();
}

var t2  = fs.readFileSync('tmp/programs-inventory-pool').toString().split( "\n" );

var CIIs = t2.map( (_) => {

    var [ inventoryId, identifier ] = _.split(";");
    return { contentOwnerIdentifierId: 170, identifier: identifier, inventoryId: inventoryId };
});

CIIs = CIIs.slice(0, 37155);


function createCII(){

    var cii         = CIIs.pop();

    connection.query(
    "INSERT INTO ContentIdentifierInventory SET ?",
    cii,
    (error, result) => {
        if(error){
            if(error.toString().indexOf('Duplicate entry') > -1) createCII();
            else console.log(error);
        }
        else {

            if(CIIs.length > 0) {

                if(CIIs.length % 1000 == 0) console.log("Remains ", CIIs.length, " to insert.")
                createCII();
            }
            else {
                terminate();
            }
        }
    })
}

createCII();

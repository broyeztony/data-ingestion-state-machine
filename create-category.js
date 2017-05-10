const fs            = require('fs');
const md5           = require('md5');
const randomstring  = require("randomstring");
const mysql         = require('mysql');

var categoriesAndName       = new Map(fs.readFileSync('files/categories').toString().split( "\n" ).map(_ => _.split(';')));

var categoryExtId2InternalId =
    fs.readFileSync('tmp/prod/category-ext2int').toString().split('\n').map(_ => _.split(';'));

fs.unlink("tmp/prod/categories", _ => _ );

var parallelData = [ ];
for (var i = 0 ; i < categoryExtId2InternalId.length ; i++){

    let categoryExtId   = categoryExtId2InternalId[i][0];
    let categoryIntId   = categoryExtId2InternalId[i][1];
    let categoryName    = categoriesAndName.get(categoryExtId);

    let category = {
        id: categoryIntId,
        name: categoryName,
        systemName: categoryName,
        inventoryId: categoryIntId
    };
    parallelData.push(category);
}

var ln = parallelData.length;

var pool      =    mysql.createPool({
    connectionLimit : 100, //important
    host            : '',
    user            : '',
    password        : '',
    database        : ''
});

var insertionCount = 0;
function create(){

    pool.getConnection(function(err, connection) {

        if (err) {
            console.log('pool.getConnection Error');
            return;
        }

        var category = parallelData.shift();

        if(category == null){
            console.log( 'done -> ', new Date().getTime() );
            pool.end();
            return;
        }

        connection.query(
            "INSERT INTO Category SET ?",
            category,
            (error, result) => {
                if (error) {
                    fs.appendFile('tmp/prod/errors/create-category-errors', JSON.stringify(category) + '->' +
                        error.toString() + '\n', (error) => {} );
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
    create();
    count++;
}







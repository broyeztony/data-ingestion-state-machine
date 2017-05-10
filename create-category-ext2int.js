const fs                    = require('fs');

var coid                    = 102;
var categoriesAndName       = fs.readFileSync('files/categories').toString().split( "\n" );
var categoriesInventoryIds  = fs.readFileSync('tmp/prod/category-inventory-pool').toString().split( "\n" );


var buffer = "";
for (let i = 0 ; i < categoriesAndName.length ; i++){

    let [ id, title ]       = categoriesAndName[ i ].split(";");
    let categoryExternalId  = id;
    var categoryInternalId  = categoriesInventoryIds[ i ];

    buffer += categoryExternalId + ";" + categoryInternalId + "\n";
}



fs.appendFile(
    "tmp/prod/category-ext2int",
    buffer,
    (error) => { if(error) console.log(error) });



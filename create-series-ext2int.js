const fs                    = require('fs');

var coid                    = 102;
var seriesAndTitle          = fs.readFileSync('files/series').toString().split( "\n" );
var seriesInventoryIds      = fs.readFileSync('tmp/prod/series-inventory-pool').toString().split( "\n" );


var buffer = "";
for (let i = 0 ; i < seriesAndTitle.length ; i++){

    var [ id, title ]     = seriesAndTitle[ i ].split(";");
    var seriesExternalId  = id;
    var seriesInternalId  = seriesInventoryIds[ i ];

    buffer += seriesExternalId + ";" + seriesInternalId + "\n";
}

fs.appendFile(
    "tmp/prod/series-ext2int",
    buffer,
    (error) => { if(error) console.log(error) });



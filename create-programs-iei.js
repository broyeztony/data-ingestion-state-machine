const fs                    = require('fs');

var coid                    = 101;
var programsAndTitle        = fs.readFileSync('files/program-titles').toString().split( "\n" );
var programInventoryIds     = fs.readFileSync('tmp/programs-inventory-pool').toString().split( "\n" );


var buffer = "";
for (let i = 0 ; i < programsAndTitle.length ; i++){

    var [ id, title ]       = programsAndTitle[ i ].split("~");
    var programExternalId   = id;
    var programInternalId   = programInventoryIds[ i ];

    buffer += programExternalId + ";" + programInternalId + "\n";
}

fs.appendFile(
    "tmp/programs-iei",
    buffer,
    (error) => { if(error) console.log(error) });



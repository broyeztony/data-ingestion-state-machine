const fs                    = require('fs');

var coid                        = 102;

// transformed
var seriesExternal2Internal     = fs.readFileSync('tmp/prod/series-ext2int').toString().split( "\n" );
var programsExternal2Internal   = fs.readFileSync('tmp/prod/programs-ext2int').toString().split( "\n" );
// source
var programs2seriesE2E          = fs.readFileSync('files/programs-to-series').toString().split( "\n" );


let seriesMapExt2Internal           = new Map(seriesExternal2Internal.map(_ => _.split(';')));
let programsMapExt2Internal         = new Map(programsExternal2Internal.map(_ => _.split(';')));
let program2seriesExt2Ext           = new Map(programs2seriesE2E.map(_ => _.split(';')));


var bufferS2P = "";
program2seriesExt2Ext.forEach((value, key) => {

    var programInternalId   = programsMapExt2Internal.get( key.toString() ); // get internal Id for program k
    var seriesInternalId    = seriesMapExt2Internal.get( value.toString() ); // get internal Id for series v

    bufferS2P += seriesInternalId + ";" + programInternalId + "\n";
});

fs.appendFile(
    "tmp/prod/series-2-programs-inter2inter",
    bufferS2P,
    (error) => { if(error) console.log(error) });



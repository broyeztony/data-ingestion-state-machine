const fs                    = require('fs');
const _                     = require('underscore');

var coid                        = 102;

var seriesInventoryIds          = fs.readFileSync('tmp/prod/series-inventory-pool').toString().split( "\n" );
var thumbnailsInventoryIds      = fs.readFileSync('tmp/prod/thumbnails-inventory-pool').toString().split( "\n" );


let zipped = _.zip(seriesInventoryIds, thumbnailsInventoryIds);

let bufferS2T = zipped.reduce( (a, b) => {
    return (a += b[0] + ';' + b[1] + '\n'); }, '');


fs.appendFile(
    "tmp/prod/series-2-thumbnails-inter2inter",
    bufferS2T,
    (error) => { if(error) console.log(error) });



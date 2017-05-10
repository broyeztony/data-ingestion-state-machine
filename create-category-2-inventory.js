const fs            = require('fs');
const md5           = require('md5');
const randomstring  = require("randomstring");
const mysql         = require('mysql');

var categoryExtId2InternalId =
    new Map(fs.readFileSync('tmp/prod/category-ext2int').toString().split('\n').map(_ => _.split(';')));

var series2categoriesSource =
    fs.readFileSync('files/series-to-categories').toString().split('\n').map(_ => _.split(';'));

var seriesInternalId2ExternalId =
    new Map(fs.readFileSync('tmp/prod/series-ext2int').toString().split('\n').map(_ => _.split(';').reverse()));

var series2programsDb =
    fs.readFileSync('tmp/prod/series-2-programs-inter2inter').toString().split('\n').map(_ => _.split(';'));

var seriesExternalId2programInternalId = series2programsDb.map( _ => {

    let seriesInternalId    = _[0];
    let programInternalId   = _[1];
    let seriesExternalId    = seriesInternalId2ExternalId.get( seriesInternalId );

    return [ seriesExternalId, programInternalId ];
});

var mapSeriesExternalId2programInternalIdList = seriesExternalId2programInternalId.reduce((a, b) => {

    let seriesExtId = b[0];
    let programInternalId = b[1];
    a.hasOwnProperty(seriesExtId) ?
        a[ seriesExtId ].push( programInternalId ) :
        a[ seriesExtId ] = [ programInternalId ];

    return a;
}, {});

var buffer = [ ];
series2categoriesSource.map( _ => {

    let seriesExternalId = _[0];

    let category1 = _[1];
    let category2 = _[2];
    let category3 = _[3];

    let hasCategory1 = (category1 != '');
    let hasCategory2 = (category2 != '');
    let hasCategory3 = (category3 != '');

    var programList = mapSeriesExternalId2programInternalIdList[ seriesExternalId ];
    if(programList){
        programList.map( programInternalId => {

            if(hasCategory1) buffer.push( [ categoryExtId2InternalId.get(category1), programInternalId ] );
            if(hasCategory2) buffer.push( [ categoryExtId2InternalId.get(category2), programInternalId ] );
            if(hasCategory3) buffer.push( [ categoryExtId2InternalId.get(category3), programInternalId ] );
        });
    }
    else {
        console.log( seriesExternalId, mapSeriesExternalId2programInternalIdList[ seriesExternalId ] );
    }
});

fs.appendFile(
    "tmp/prod/category-2-inventory",
    buffer.join('\n'),
    (error) => { if(error) console.log(error) });


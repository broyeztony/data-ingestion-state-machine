const fs            = require('fs');
const randomstring  = require("randomstring");
const mysql         = require('mysql');
const moment        = require('moment');
const md5           = require('md5');


var connectionLocal = mysql.createConnection({
    host            : 'localhost',
    user            : 'root',
    password        : 'root',
    database        : 'local'
});

var connection = connectionLocal;
connection.connect( (_) => { console.log( "threadId -> ", connection.threadId); });


function terminate( error ){
    if(error) console.log(error);
    connection.end();
}

var t0  = fs.readFileSync('files/program-titles').toString().split( "\n" );
var t1  = fs.readFileSync('files/program-to-duration').toString().split( "\n" );
var t2  = fs.readFileSync('tmp/programs-inventory-pool').toString().split( "\n" );

var programs    = { };
t0.map( (_) => {

        var [ id, title ] = _.split("~");
        programs[ id ] = {
            title: title,
            duration: 0
        };
    });

t1.map( (_) => {

    var [ id, duration ] = _.split(";");

    if(programs.hasOwnProperty(id)){
        programs[ id ].duration = duration;
    }
});

t2.map( (_) => {

    var [ inventoryId, identifier ] = _.split(";");

    if(programs.hasOwnProperty(identifier))
        programs[ identifier ].inventoryId = inventoryId
});

var coid = 102;
var identifiers = Object.keys( programs ).slice(0, 34031);

function createProgram(){

    var identifier  = identifiers.pop();
    var p           = programs[ identifier ];
    var validFrom   = moment( new Date() ).format('YYYY-MM-DD HH:mm:ss');
    var hash        = md5(  coid +
                            ":" +
                            JSON.stringify( { id: p.inventoryId, title: p.title, duration: p.duration,
                                              validFrom: validFrom, description: null } ) );

    var _ = {
        id              : p.inventoryId,
        inventoryId     : p.inventoryId,
        duration        : p.duration,
        title           : p.title,
        validFrom       : validFrom,
        uniqueString    : hash
    };

    connection.query(
    "INSERT INTO Program SET ?",
    _,
    (error, result) => {
        if(error){
            if(error.toString().indexOf('Duplicate entry') > -1) createProgram();
            else console.log(error);
        }
        else {

            if(identifiers.length > 0) {

                if(identifiers.length % 1000 == 0) console.log("Remains ", identifiers.length, " to insert.")
                createProgram();
            }
            else {
                terminate();
            }
        }
    })
}

createProgram();
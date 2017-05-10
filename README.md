# data-ingestion-state-machine
A collection of (redundant) scripts to assemble into a metadata ETL deterministic, fault-tolerant state machine

Here, the design (Hadoop inspired) is definetely more relevant thant the code itself.
The purpose is to build a state machine that process scripts consecutively taking the output of the previous script 
as input of the next one.
Each script is achieving a low granularity operation which can be safely processed concurrently 
(leveraging node.js Mysql pool connections https://github.com/mysqljs/mysql#pooling-connections) and the output is written 
to a file.

It is deterministic, debug-friendly and fault-tolerant.
 - Each script has to produce an exact result
 - Each step's success and failure are written to specific files making it easy to identify the failing operations
 - The failing scripts can be reprocessed
 - most of the scripts are idempotent
 
Performs various operations:
 - creating MySQL entities and relationship
 - fetching, resizing and uploading images to Amazon S3
 

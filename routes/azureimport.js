var express = require('express');
var router = express.Router();
var azure = require('azure-storage');
var faker = require('faker');
var uuid = require('node-uuid');

require('sugar');

var retryPolicy = azure.ExponentialRetryPolicyFilter();
var tableSvc = azure.createTableService('evrystoragetest001', 'upabFKzPK4nW7mxvJ318IrHirk2ND12SFjEGQHwkn1cgTpaASgYGxDNEyQmU39O+047Yrvn4VmIDTta5MCPTIg==').withFilter(retryPolicy);
var blobSvc = azure.createBlobService('evrystoragetest001', 'upabFKzPK4nW7mxvJ318IrHirk2ND12SFjEGQHwkn1cgTpaASgYGxDNEyQmU39O+047Yrvn4VmIDTta5MCPTIg==');





var tableName = 'mytable';// + Date.create().format('{ss}{ms}');
var noOfBatches = 100;
var batchSize = 100;
var extraSize = 400;



router.route('/import').post(function (req, res) {
    tableName = req.body.tablename;
    noOfBatches = req.body.noofbatches;
    batchSize = req.body.batchsize;
    extraSize = req.body.extrasize;
    
    createTable(function (error) {
        if (!error) {
            createBatches(function (error, result) {
                if (!error) {
                    
                    sendBatches(result, function (error, result) {
                        if (error) {
                            res.json(error);
                        }
                    });
                }
            });

            res.json({ message: 'Import done!' });
        }
    });
    
});


function createTable(callback) {
    tableSvc.createTableIfNotExists(tableName, function (error, result, response) {
        if (error) {
            console.log(error);
            return callback(error);
        }
        else
            callback(false);
        
        //console.log(Date.create().format('{mm}:{ss}:{ms}'));
        //sendBatches();
        //console.log(Date.create().format('{mm}:{ss}:{ms}'));
        
        //getResult();
    });
}


function createBatches(callback) {
    batches = new Array();

    var entGen = azure.TableUtilities.entityGenerator;
    
    var largeString = 'extra space'.padRight(extraSize, '*');
    var partitionKeys = ['hometask', 'awaytask', 'testtask', 'untask', 'task'];
    
    console.time('create batch');

    for (var x = 1; x <= noOfBatches; x++) {
        
        var batch = new azure.TableBatch();
        var partition = partitionKeys[(x % 5)];
        var bloblocation = tableName;
        partition = uuid.v4();
        
        for (var i = 0; i < batchSize; i++) {
            var task = {
                PartitionKey: entGen.String(partition),
                RowKey: entGen.String(x.toString() + '-' + i.toString()),
                dueDate: entGen.DateTime(new Date(Date.UTC(2015, 6, 20))),
                extraInfo: entGen.String(largeString),
                firstName: entGen.String(faker.name.firstName()),
                lastName: entGen.String(faker.name.lastName()),
                title: entGen.String(faker.name.title()),
                firstName: entGen.String(faker.name.firstName()),
                jobTitle: entGen.String(faker.name.jobTitle()),
                jobDescription: entGen.String(faker.name.jobDescriptor()),
                jobArea: entGen.String(faker.name.jobArea()),
                jobType: entGen.String(faker.name.jobType()),
                phone: entGen.String(faker.phone.phoneNumber()),
                company: entGen.String(faker.company.companyName()),
                catchPhrase: entGen.String(faker.company.catchPhrase()),
                department: entGen.String(faker.commerce.department()),
                product: entGen.String(faker.commerce.product()),
                filepath: entGen.String(bloblocation+'/testblob.txt'),
            };
            
            batch.insertOrMergeEntity(task, { echoContent: false });
        };
        
        batches.push(batch);
    };
    
    console.log('Table: ' + tableName);
    console.log('Size: ' + memorySizeOf(batches));
    console.timeEnd('create batch');
    
    callback(false, batches);
}

function sendBatches(batches, callback) {
    var async = require('async');
    
    console.time('send batch');

    async.forEach(batches
    , function batchIterator(batch, callback) {
        tableSvc.executeBatch(tableName, batch, function (error, result, response) {
            if (!error) {
                callback(null);
            } else {
                callback(error);
                console.log(error);
            }   
        });   
    }, function (error) {
        if (!error) {
        } else {
            console.log(error);
        }
    }
    );
    
    console.timeEnd('send batch');
    callback(false, 'Done');
}

function sendBatchesFiles() {
    var async = require('async');
    
    async.forEach(batches
    , function batchIterator(batch, callback) {
        tableSvc.executeBatch(tableName, batch, function (error, result, response) {
            if (!error) {
                blobSvc.createContainerIfNotExists(tableName, function (error, result, response) {
                    if (!error) {
                        async.forEach(batch.operations, function (blob, callback) {
                            blobSvc.createBlockBlobFromText(tableName, blob.entity.RowKey._ , 'testar lite mer av detta. \nHur nu det fungerar.', function (error, result, response) {
                                if (!error) {
                                    callback(null);
                                } else {
                                    callback(error);
                                    console.log(error);
                                }
                            });
                        });
                    }
                })
            } else {
                callback(error);
                console.log(error);
            }
        });
    }, function (error) {
        if (!error) {
        } else {
            console.log(error);
        }
    }
    );
}


function getResult() {
    var query = new azure.TableQuery()
  .top(5)
  .where('PartitionKey eq ?', 'hometasks3')
  .and('RowKey eq ?', '1-5');
    
    tableSvc.queryEntities(tableName, query, null, function (error, result, response) {
        if (!error) {
            var res = result.entries;
            console.log(res[0]);
        }
    });
}


function memorySizeOf(obj) {
    var bytes = 0;
    
    function sizeOf(obj) {
        if (obj !== null && obj !== undefined) {
            switch (typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if (objClass === 'Object' || objClass === 'Array') {
                        for (var key in obj) {
                            if (!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes;
    };
    
    function formatByteSize(bytes) {
        if (bytes < 1024) return bytes + " bytes";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB";
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB";
        else return (bytes / 1073741824).toFixed(3) + " GiB";
    };
    
    return formatByteSize(sizeOf(obj));
};

module.exports = router;
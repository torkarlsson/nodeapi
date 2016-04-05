var express = require('express');
var router = express.Router();
var azure = require('azure-storage');

var tableSvc = azure.createTableService('evrystoragetest001', 'upabFKzPK4nW7mxvJ318IrHirk2ND12SFjEGQHwkn1cgTpaASgYGxDNEyQmU39O+047Yrvn4VmIDTta5MCPTIg==');
var tableName = 'mytable08547';

function runQuery(table, query, callback) {
    if (table == null)
        table = tableName;

    tableSvc.queryEntities(table, query, null, function (error, result, response) {
        if (!error) {
            callback(false, result.entries);
        }
        else {
            callback(true, null);
        }
    });
}

/* GET task list */
router.route('/topfive/:table/:partition').get(function (req, res) {
    var table = req.params.table;
    var filter = req.query.filter;
    var query = new azure.TableQuery()
    .top(5)
    .where('PartitionKey eq ?', req.params.partition)
    .and(filter);
        
    runQuery(table, query, function (error, result) {
        if (!error)
            res.json(result);
        else
            res.send(error);
        }
    );
});

router.route('/topfive/:id').get(function (req, res) {
    var query = new azure.TableQuery()
    .top(5)
    .where('RowKey eq ?', req.params.id);
    
    var table = req.query.tablename;

    runQuery(table, query, function (error, result) {
        if (!error)
            res.json(result);
        else
            res.send(error);
    });
});

router.route('/task/:table/:partition/:row').get(function (req, res) {
    var query = new azure.TableQuery()
    .where('PartitionKey eq ?', req.params.partition)
    .and('RowKey eq ?', req.params.row);
    
    var table = req.params.table;
    
    runQuery(table, query, function (error, result) {
        if (!error)
            res.json(result);
        else
            res.send(error);
    });
});

router.route('/task/:table/').get(function (req, res) {
    var table = req.params.table;
    var filter = req.query.filter;
    var query = new azure.TableQuery()
    .where(filter);
    
    if (req.query.select != null) {
        var sel = req.query.select.split(",");
        query._fields = sel;
    }
    
    if (req.query.top != null) {
        query.top(req.query.top);
    }
    
    runQuery(table, query, function (error, result) {
        if (!error) {
            console.log('No of rows: ' + result.length);
            res.json(result);
        }
        else
            res.send(error);
    }
    );
});

module.exports = router;
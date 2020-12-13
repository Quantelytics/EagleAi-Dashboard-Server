var paths = require('../config/paths');
console.log(paths);
var async = require("async");

var database = require('../config/database');
const schemaName=database.schema;
const { Pool } = require('pg')

var pooldict;
if(database.port != ''){
    pooldict = {
        host: database.host,
        database: database.name,
        port: database.port,
        user: database.user,
        password: database.password
    };
}
else {
    pooldict = {
        host: database.host,
        database: database.name,
        user: database.user,
        password: database.password
    };
};

const pool = new Pool(pooldict);

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('server.properties');

const filename = paths.logdir + "/" + properties.get('log4j.filename');
console.log(filename);

// log4j details
const log4js = require('log4js');

log4js.configure({
    appenders: { commonApi: { type: properties.get('log4j.type'),
                            filename: paths.logdir + "/" + properties.get('log4j.filename'),
                            maxLogSize: properties.get('log4j.logfilesize'),
                            backups: properties.get('log4j.noofdays'),
                            compress: true
                          }
             },
    categories: { default: { appenders: ['commonApi'],
                             level: properties.get('log4j.logger.level') } }
});
const logger = log4js.getLogger('commonApi');

module.exports = function (app) {
    //To Get all roots
    app.get('/', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        let start = new Date();
        var sql = "select row_to_json("+schemaName+".get_rootmodellist())";
        logger.debug("QUERY: "+sql);
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of roots list is "+Math.abs((end.getTime() - start.getTime())/1000));
            if(err)
            { 
                logger.error(sql+'==>'+err );
            } 
            res.send(json);
        });
    })

    /* Get model modelhierarchy.*/
    app.get('/getModelhierarchy', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var sql = "select row_to_json( a1) from "+schemaName+".modelhierarchy a1 order by rank";
        logger.debug("QUERY: "+sql);
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of model outputs is "+Math.abs((end.getTime() - start.getTime())/1000)) 
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    app.get('/getModelGroupBy', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var sql = "select row_to_json("+schemaName+".get_modelgroupbys())";
        logger.debug("QUERY: "+sql);
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of model groupbys is "+Math.abs((end.getTime() - start.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    /* Get List of all issue types by filter.
     * Here filter is root values.
     */
    app.get('/getIssues/:filter', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var filter=req.params.filter.charAt(0).toUpperCase()+req.params.filter.substr(1);
        if(filter!='NULL'){
            filter="'"+filter+"'";
        }
        var sql = "select row_to_json("+schemaName+".get_issuetypes("+filter+"))";
        logger.debug("QUERY: "+sql);
        pool.query(sql , (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of get issues by "+filter+" "+Math.abs((end.getTime() - start.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    /* Get Time series based on type .
     * Last Read value is either null or last time of request that sent in format "yyyy-MM-dd hh:mm"
     */
    app.get('/getTs/:type/:filter/:issue/:lastRead/:dateFilter/:root', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var type=req.params.type.toUpperCase();
        if(type!='NULL'){
            type="'"+type+"'";
        }
        var filter=req.params.filter.charAt(0).toUpperCase()+req.params.filter.substr(1);
        var issue=req.params.issue.toUpperCase();
        if(issue!='NULL'){
            issue="'"+issue+"'";
        }
        var lastRead=req.params.lastRead.toUpperCase();
        if(lastRead!='NULL'){
            lastRead=lastRead.toUpperCase();
        }
        var dateFilter=req.params.dateFilter;
        if(dateFilter!='NULL'){
            dateFilter="'"+dateFilter+"'";
        }
        var root=req.params.root;
        var sql = "select row_to_json("+schemaName+".get_tsdata("+type+","+ filter+","+issue+","+lastRead+","+dateFilter+",'"+root+"'))";logger.debug("QUERY: "+sql);

        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of Time Series of "+filter+" is "+Math.abs((end.getTime() - start.getTime())/1000));
            if(err)
            { 
            logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    //Get List of orders by individual
    app.get('/getOrders/:root/:filterType/:filterValue/:issue/:startTime/:endTime', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        let s = new Date();
        var root=req.params.root;
        if(root!='NULL'){
            root="'"+root+"'";
        }
        var filterType=req.params.filterType.toUpperCase();
        if(filterType!='NULL'){
            filterType="'"+filterType+"'";
        }
        var filterValue=req.params.filterValue;
        if(filterType!='NULL'){
            filterValue="'"+filterValue+"'";
        }
        var issue=req.params.issue.toUpperCase();
        if(issue!='NULL'){
            issue="'"+issue+"'";
        }
        var startTime=req.params.startTime;
        if(startTime!='NULL'){
            startTime="'"+startTime+"'";
        }
        var endTime=req.params.endTime;
        if(endTime!='NULL'){
            endTime="'"+endTime+"'";
        }
        var sql = "select row_to_json("+schemaName+".get_orders_history("+root+","+filterType+","+filterValue+","+issue+","+startTime+","+endTime+"))";
        logger.debug("QUERY: "+sql);
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let e=new Date();
            logger.debug("Time taken for orders history execution "+Math.abs((e.getTime() - s.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    /* Get List of all participation fields.*/
    app.get('/getParticipationdetailfield', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var sql = "select ("+schemaName+".get_modelparticipationdetailfields())";
        logger.debug("QUERY: "+sql);
        pool.query(sql , (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of getParticipationdetailfield "+Math.abs((end.getTime() - start.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    //Get piecharts of participation by individual
    app.get('/getParticipation/:root/:filterType/:filterValue/:aggType/:issue/:startTime/:endTime', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        let s = new Date();
        var root=req.params.root;
        if(root!='NULL'){
            root="'"+root+"'";
        }
        var filterType=req.params.filterType.toUpperCase();
        if(filterType!='NULL'){
            filterType="'"+filterType+"'";
        }
        var aggType=req.params.aggType.toUpperCase();
        if(aggType!='NULL'){
            aggType="'"+aggType+"'";
        }
        var filterValue=req.params.filterValue;
        if(filterType!='NULL'){
            filterValue="'"+filterValue+"'";
        }
        var issue=req.params.issue.toUpperCase();
        if(issue!='NULL'){
            issue="'"+issue+"'";
        }
        var startTime=req.params.startTime;
        if(startTime!='NULL'){
            startTime="'"+startTime+"'";
        }
        var endTime=req.params.endTime;
        if(endTime!='NULL'){
            endTime="'"+endTime+"'";
        }
        var sql = "select row_to_json("+schemaName+".get_participation_details(rootfilter=>"+root+",dtype=>"+filterType+",dfilter=>"+filterValue+",agg_type=>"+aggType+",groupbyfilter=>"+issue+",start_time=>"+startTime+",end_time=>"+endTime+"))";
        //var sql = "select row_to_json("+schemaName+".get_participation_details("+root+","+filterType+","+filterValue+","+aggType+","+issue+","+startTime+","+endTime+"))"; 
        logger.debug("QUERY: "+sql);
        pool.query(sql , (err, response) => {
            var json=formatJson(response);
            let e=new Date();
            logger.debug("Time taken for participation details "+Math.abs((e.getTime() - s.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    app.get('/getScatterData/:modelfeature/:issuetype', function (req, res) {
        var modelfeature=req.params.modelfeature;
        var issuetype=req.params.issuetype.toUpperCase();
        if(issuetype!='NULL'){
            issuetype="'"+issuetype+"'";
        } 
        let s = new Date()
        var sql = "select row_to_json("+schemaName+".get_scatterdata('"+modelfeature+"',groupbyfilter=>"+issuetype+"))";
        logger.debug("QUERY: "+sql);
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let e=new Date();
            logger.debug("Time taken for "+modelfeature+" execution "+Math.abs((e.getTime() - s.getTime())/1000))
            if(err)
            { 
            logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    });

    app.get('/getClusterData/:rootValue', function (req, res) {
        var rootValue=req.params.rootValue;
        let s = new Date()
        var sql = "select row_to_json("+schemaName+".get_clusterdata(rootvalue => '"+rootValue+"',targettype=>'ALPHA'))";
        logger.debug("QUERY: "+sql);
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let e=new Date();
            logger.debug("Time taken for get_clusterdata execution "+Math.abs((e.getTime() - s.getTime())/1000))
            if(err)
            { 
            logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    });
 
    app.get('/getModelValues/:rootValue/:modelValue', function (req, res) {
        var modelValue=req.params.modelValue;
        var rootValue=req.params.rootValue;
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');

        if(rootValue=='NULL'){
            rootValue='';
        }

        var sql = "select row_to_json("+schemaName+".get_modelvalues ('"+rootValue+"','"+modelValue+"'))";
        logger.debug("QUERY: "+sql);
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of  modelvalues list is "+Math.abs((end.getTime() - start.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });

     })

    app.get('/getAggTotalsEod/:type/:filter/:issue/:tDate/:root', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var type=req.params.type;
        if(type!='NULL'){
            type="'"+type+"'";
        }
        var filter=req.params.filter;
        if(filter!='NULL'){
            filter="'"+filter+"'";
        }
        var issue=req.params.issue.toUpperCase();
        if(issue!='NULL'){
            issue="'"+issue+"'";
        }
        var tdate=req.params.tDate;
        if(tdate!='NULL'){
            tdate="'"+tdate+"'";
        }
        var root=req.params.root;
        if(root!='NULL'){
            root="'"+root+"'";
        }
        var sql = "select row_to_json("+schemaName+".get_aggtotals_eod(datatype=>"+type+",datafilter=>"+filter+",groupbyfilter=>"+issue+",rootvalue=>"+root+"))";
        logger.debug("QUERY: "+sql);
        let s = new Date();
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let e=new Date();
            logger.debug("Time taken for Trend Analysis "+type+": "+filter+"  execution "+Math.abs((e.getTime() - s.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    app.get('/getAggtotalsPiedata/:type/:filter/:tDate/:root', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var type=req.params.type;
        if(type!='NULL'){
            type="'"+type+"'";
        }
        var filter=req.params.filter;
        if(filter!='NULL'){
            filter="'"+filter+"'";
        }
        var tdate=req.params.tDate;
        if(tdate!='NULL'){
            tdate="'"+tdate+"'";
        }
        var root=req.params.root;
        if(root!='NULL'){
            root="'"+root+"'";
        }
        var sql = "select row_to_json("+schemaName+".get_aggtotals_piedata(datatype=>"+type+",datafilter=>"+filter+",rootvalue=>"+root+"))";
        logger.debug("QUERY: "+sql);
        let s = new Date();
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let e=new Date();
            logger.debug("Time taken for Trend Analysis Pie Data"+type+": "+filter+"  execution "+Math.abs((e.getTime() - s.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    app.get('/getGeneralData/:filter/:type/:charttype/:targetType/:groupby', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var type=req.params.type;
        var charttype=req.params.charttype;
        var targetType=req.params.targetType;
        var filter=req.params.filter;
        var groupby=req.params.groupby;
        if(groupby=='NULL'){
            groupby=null;
        }else{
            groupby="'"+groupby+"'";
        }

        if(targetType!='NULL'){
             
            var sql = "select row_to_json("+schemaName+".get_"+charttype+"data('"+type+"',rootvalue=>'"+filter+"',groupbyfilter=>"+groupby+",targettype=>'"+targetType+"'))";
          
        }else{
            var sql = "select row_to_json("+schemaName+".get_"+charttype+"data('"+type+"',rootvalue=>'"+filter+"',groupbyfilter=>"+groupby+"))";
        }
        logger.debug("QUERY: "+sql);
        let s = new Date();
        pool.query(sql, (err, response) => {
            if(targetType!='NULL'){
                var id=filter+"_"+type+"_"+targetType.split(" ").join("_").toLowerCase();
            }else{
                var id=filter+"_"+targetType.split(" ").join("_").toLowerCase();
            }
            var json={};
            json={"id":id,"data":formatJson(response)};
            let e=new Date();
            logger.debug("Time taken for "+type+": "+filter+"  execution "+Math.abs((e.getTime() - s.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })
 
    app.get('/getModelCharts', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var sql = "select row_to_json("+schemaName+".get_modelcharts())";
        logger.debug("QUERY: "+sql);
        pool.query(sql, (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of model charts is "+Math.abs((end.getTime() - start.getTime())/1000))
            if(err)
            { 
                logger.error(sql+'==>'+err );
            }
            res.send(json);
        });
    })

    /*version-1 related extra code */
    //To Get all Desks
    app.get('/desks', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        let start = new Date();
        pool.query("select row_to_json("+schemaName+".get_desks(NULL))", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of divisions list is "+Math.abs((end.getTime() - start.getTime())/1000));
            res.send(json);
        });
    })

    app.get('/getRMS/:filter/:issue/:lastRead/:dateFilter', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var filter=req.params.filter;
        if(filter!='NULL'){
            filter="'"+filter+"'";
        }
        var issue=req.params.issue.toUpperCase();
        if(issue!='NULL'){
            issue="'"+issue+"'";
        }
        var lastRead=req.params.lastRead.toUpperCase();
        if(lastRead!='NULL'){
            lastRead=lastRead.toUpperCase();
        }
        var dateFilter=req.params.dateFilter;
        if(dateFilter!='NULL'){
            dateFilter="'"+dateFilter+"'";
        }
        var finRes=[];
        async.series({
            tsData: function(callback){
                logger.debug("select row_to_json("+schemaName+".get_tsdata('DIVISION',"+filter+","+issue+","+lastRead+","+dateFilter+"))");
                let s = new Date();
                pool.query("select row_to_json("+schemaName+".get_tsdata('DIVISION',"+filter+","+issue+","+lastRead+","+dateFilter+"))", (err, response) => {
                    var json=formatJson(response);
                    var filtered=json.filter(function(item){
                        return item.division==req.params.filter;
                    });
                    let e=new Date();
                    logger.debug("Time taken for "+filter+" tsData execution "+Math.abs((e.getTime() - s.getTime())/1000))
                    callback(null, filtered);
                });
            },
            ClientData: function(callback){
                logger.debug("select row_to_json("+schemaName+".get_scatterdata('CLIENT',"+issue+","+lastRead+","+dateFilter+"))");
                let s = new Date();
                pool.query("select row_to_json("+schemaName+".get_scatterdata('CLIENT',"+issue+","+lastRead+","+dateFilter+"))", (err, response) => {
                    var json=formatJson(response);
                    //console.log(json);
                    var filtered=json.filter(function(item){
                        return item.division==req.params.filter;
                    });
                    let e=new Date();
                    logger.debug("Time taken for "+filter+" ClientData execution "+Math.abs((e.getTime() - s.getTime())/1000))
                    callback(null, filtered);
                });
            },
            SymbolData: function(callback){
                logger.debug("select row_to_json("+schemaName+".get_scatterdata('SYMBOL',"+issue+","+lastRead+","+dateFilter+"))");
                let s = new Date();
                pool.query("select row_to_json("+schemaName+".get_scatterdata('SYMBOL',"+issue+","+lastRead+","+dateFilter+"))", (err, response) => {
                    var json=formatJson(response);
                    var filtered=json.filter(function(item){
                        return item.division==req.params.filter;
                    });
                    let e=new Date();
                    logger.debug("Time taken for "+filter+" SymbolData execution "+Math.abs((e.getTime() - s.getTime())/1000))
                    callback(null, filtered);
                });
            },
            TRADER: function(callback){
                logger.debug("select row_to_json("+schemaName+".get_heatmapdata('TRADER',"+ issue+","+lastRead+","+dateFilter+"))");
                let s = new Date();
                pool.query("select row_to_json("+schemaName+".get_heatmapdata('TRADER',"+ issue+","+lastRead+","+dateFilter+"))", (err, response) => {
                    var json=formatJson(response);
                    var filtered=json.filter(function(item){
                        return item.division==req.params.filter;
                    });
                    let e=new Date();
                    logger.debug("Time taken for "+filter+" TRADER execution "+Math.abs((e.getTime() - s.getTime())/1000))
                    callback(null, filtered);
                });
            },
            OMPROCESS: function(callback){
                logger.debug("select row_to_json("+schemaName+".get_heatmapdata('OMPROCESS',"+ issue+","+lastRead+","+dateFilter+"))");
                let s = new Date();
                pool.query("select row_to_json("+schemaName+".get_heatmapdata('OMPROCESS',"+ issue+","+lastRead+","+dateFilter+"))", (err, response) => {
                    var json=formatJson(response);
                    var filtered=json.filter(function(item){
                        return item.division==req.params.filter;
                    });
                    let e=new Date();
                    logger.debug("Time taken for "+filter+" OMPROCESS execution "+Math.abs((e.getTime() - s.getTime())/1000))
                    callback(null, filtered);
                });
            },
            Outlier: function(callback){
                logger.debug("select row_to_json("+schemaName+".get_singleorder_outlierdata("+issue+","+lastRead+","+filter+"))");
                let s = new Date();
                pool.query("select row_to_json("+schemaName+".get_singleorder_outlierdata("+issue+","+lastRead+","+filter+"))", (err, response) => {
                    var json=formatJson(response);
                    var filtered=json.filter(function(item){
                        return item.division==req.params.filter;
                    });
                    let e=new Date();
                    logger.debug("Time taken for "+filter+" Outlier execution "+Math.abs((e.getTime() - s.getTime())/1000))
                    callback(null, filtered);
                });
            },
            Bar: function(callback){
                logger.debug("select row_to_json("+schemaName+".get_barchartdata('DESK',"+ issue+","+lastRead+"))");
                let s = new Date();
                pool.query("select row_to_json("+schemaName+".get_barchartdata('DESK',"+ issue+","+lastRead+"))", (err, response) => {
                    var json=formatJson(response);
                    var filtered=json.filter(function(item){
                        return item.division==req.params.filter;
                    });
                    let e=new Date();
                    logger.debug("Time taken for "+filter+" Bar execution "+Math.abs((e.getTime() - s.getTime())/1000))
                    callback(null, filtered);
                });
            }
        },
        function(err, results) {
            let end=new Date();
            logger.debug("Time taken for execution of "+filter+" is "+Math.abs((end.getTime() - start.getTime())/1000))
           res.send(results);
        });

    })

    app.get('/getRegNms', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        pool.query("select row_to_json("+schemaName+".get_regnms_agg_data())", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getShortSellClient', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        pool.query("select row_to_json("+schemaName+".get_shortsell_client_agg_data())", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getShortSellSymbol', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        pool.query("select row_to_json("+schemaName+".get_shortsell_symbol_agg_data())", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getMar', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        pool.query("select row_to_json("+schemaName+".get_mar_agg_data())", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getLocateAnoms', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        pool.query("select row_to_json("+schemaName+".get_locate_anomaly_data())", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getOrderCapacityAnoms', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        pool.query("select row_to_json("+schemaName+".get_ordercapacity_anomaly_data())", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getSpoofing', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var d = new Date().toISOString().split('T')[0];
        pool.query("select row_to_json("+schemaName+".get_spoofingincidents('2019-03-29'))", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getfrontrunning', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        var d = new Date().toISOString().split('T')[0];
        logger.debug("select row_to_json("+schemaName+".get_frontrunningincidents('"+d+"'))");
        pool.query("select row_to_json("+schemaName+".get_frontrunningincidents('2019-3-29'))", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of REG NMS is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getModelInputs', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        pool.query("select "+schemaName+".get_model_inputs()", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of model inputs is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    app.get('/getModelOutputs', function (req, res) {
        let start = new Date();
        res.setHeader('Content-Type', 'application/json');
        pool.query("select row_to_json("+schemaName+".get_model_outputs())", (err, response) => {
            var json=formatJson(response);
            let end=new Date();
            logger.debug("Time taken for execution of model outputs is "+Math.abs((end.getTime() - start.getTime())/1000))
            res.send(json);
        });
    })

    /*End of Version-1 extra code */

 
    //Extract 'Rows' data from above request's response to send array of data in json
    var formatJson=function(response){
        var finResponse=[];
        if(response!=undefined && response.rows!=undefined){
            response.rows.forEach(function(row){
                if(row.row_to_json!=undefined){
                    finResponse.push(row.row_to_json);
                }else{
                    finResponse.push(row);
                }
            })
        }
        return finResponse;
    }
};

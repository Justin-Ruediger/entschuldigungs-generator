var mysql = require('mysql2/promise');
var promisify = require('util').promisify;
var database;
/*
  host: "206.189.249.7:330",
  user: "entgen",
  password: "xXO1poV6F0JOmvyN",
  database: "nodemysql"
*/
async function connect(host, username, password, database) {
    var config = {
        host: host,
        user: username,
        password: password,
        database: database
    };

    const pool = mysql.createPool(config);
    this.database = await pool.getConnection();
    return;
    this.database.connect(function(err) {
        if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }
      
       console.log('connected as id ' + database.threadId);
      });
      console.log(database);
}
async function query(sql, values){
    var [rows, fields] = await this.database.execute(sql, values);
    return rows;
}
module.exports = {connect, query};

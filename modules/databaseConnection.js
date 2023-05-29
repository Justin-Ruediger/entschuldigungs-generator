require("dotenv").config();
var mysql = require("mysql2/promise");
var promisify = require("util").promisify;
var database;
var config;

async function connect(
  host = process.env.DB_HOST,
  username = process.env.DB_USERNAME,
  password = process.env.DB_PASSWORD,
  database = process.env.DB_DATABASE
) {
  config = {
    host: host,
    user: username,
    password: password,
    database: database,
    connectionLimit: 2,
  };
  const pool = mysql.createPool(config);
  this.database = await pool.getConnection();
  return;
  this.database.connect(function (err) {
    if (err) {
      console.error("error connecting: " + err.stack);
      return;
    }

    console.log("connected as id " + database.threadId);
  });
  console.log(database);
}
async function query(sql, values) {
  try {
    var [rows, fields] = await this.database.execute(sql, values);
    return rows;
  } catch (err) {
    console.log("Error in query, maybee connection lost");
    console.log(err.values);
    //Reconnect
    try {
      const pool = mysql.createPool(config);
      this.database = await pool.getConnection();

      var [rows, fields] = await this.database.execute(sql, values);
      return rows;
    } catch (err) {
      console.log(err);
    }

    console.log(err);
    return false;
  }
}
module.exports = { connect, query };

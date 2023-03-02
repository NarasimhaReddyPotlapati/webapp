const config = require('../serve/config');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = database = {};

let created= false;

database.initialize = initialize;

initialize();''

async function initialize() {
  if(created){
    return;
  }
    const { HOST, MYSQL_USERNAME, MYSQL_PASSWORD, DATABASE_NAME, DATABASE_PORT } = config;

    const connection = await mysql.createConnection({  
      host: HOST,
      port: DATABASE_PORT,
      user: MYSQL_USERNAME,
      password: MYSQL_PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\`;`);

    // connect to database
    const sequelize = new Sequelize(config.DATABASE_NAME, config.MYSQL_USERNAME, config.MYSQL_PASSWORD, {host: config.HOST, dialect: 'mysql' });

    // init models and add them to the exported database object
    database.User = require('../model/model')(sequelize);
    database.Product = require('../model/productModel')(sequelize);
    database.Image = require('../model/imageModel')(sequelize);
    // sync all models with database
    await sequelize.sync();
    
    created = true;
}

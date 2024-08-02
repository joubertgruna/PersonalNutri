const knex = require('knex')({
    client: 'mysql2',
    connection: {
      host: '208.68.38.173',
      port: 3306,
      user: 'root',
      password: '20IDEbrasil@20M',
      database: 'personalNutri',
    },
  });

module.exports = knex

const databaseHost = process.env.DATABASE_HOST.trim();
const databasePort = process.env.DATABASE_PORT.trim();
const databaseUser = process.env.DATABASE_USER.trim();
const databasePassword = process.env.DATABASE_PASSWORD.trim();
const databaseName = process.env.DATABASE_NAME.trim();
const databaseSchema = process.env.DATABASE_SCHEMA.trim();

module.exports = {
    host : `${databaseHost}`,
    port : `${databasePort}`,
    name : `${databaseName}`,
    schema : `${databaseSchema}`,
    user : `${databaseUser}`,
    password : `${databasePassword}`
};

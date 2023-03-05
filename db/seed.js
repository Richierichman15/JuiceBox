const { Client } = require('pg');

const {
    client,
    getAllUsers
} = require('./index');

const client = new Client('postgres:localhost:5432/juicebox-dev');

const dropTables = async() => {
    try {
        console.log("Starting to drop tables...");

        await client.query(`
        DROP TABLE IF EXISIT users;
        `);
        console.log("Finsihed dropping tables");
    } catch (err) {
        console.log("Error dropping tables!");
        throw err;
    }
};

const createTables = async() => {
    try {
        console.log("Starting to build tables...");

        await client.query(`
        CREATE TABLE USERS (
            id SERIAL PRIMAMRY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL
        )
        `);
        console.log("Finished building tables!");
    } catch (err) {
        console.log("Error building tables!");
        throw err;
    }
};

const rebuildDB = async() => {
    try {
        client.connect();

        await dropTables();
        await createTables();
    } catch (err) {
        console.error(err);
    } finally {
        client.end();
    }
};

const testDB = async() => {
    try {
        client.connect();
        
        const {rows} = await client.query(`SELECT * FROM users;`);

        console.log(rows);
    } catch (error) {
        console.error(error);
    } finally {
        client.end();
    }
};


rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => client.end());







modeule.exports = {
    client,
    getAllUsers
};
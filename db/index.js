const getAllUsers = async() => {
    const { rows } = await client.query(
        `SELECT id, username
        FROM users;
        `);
        return rows;
}

async function createUser({ username, password }) {
    try {
        const result = await client.query(`
        INSERT INTO users (username, password) 
        VALUES ($1, $2);
        ON CONFLICT (username) DO NOTHING
        RETURNING *;
        `, [ username, password])
    } catch (err) {
        throw err;
    }
}

module.exports = {
    client,
    getAllUsers,
    createUser
}
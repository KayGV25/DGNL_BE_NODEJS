import pool from "../database/sql";

export const tokenRepository = {
    async deleteToken(token: string): Promise<boolean> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const res = await client.query(
                `DELETE FROM indentity.tokens
                WHERE token = $1;`, 
                [token]);

            await client.query('COMMIT');

            console.log(`Deleted ${res.rowCount} row(s).`);
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error deleting token:", error);
            throw error;
        }
    },

    async getTokenByUserId(userId: string): Promise<string | null> {
        const queryText = `
            SELECT token FROM identity.tokens
            WHERE user_id = $1;
        `;
        const res = await pool.query(queryText, [userId]);
        return res.rows.length > 0 ? res.rows[0].token : null;
    },

    async insertToken(userId: string, token: string): Promise<number> {
        const queryText = `
            INSERT INTO identity.tokens (user_id, token)
            VALUES ($1, $2);
        `;
        const res = await pool.query(queryText, [userId, token]);
        return res.rowCount || 0;
    },

    async deleteTokensByUserId(userId: string): Promise<number> {
        const queryText = `
            DELETE FROM identity.tokens
            WHERE user_id = $1;
        `;
        const res = await pool.query(queryText, [userId]);
        return res.rowCount || 0;
    },

    async upsertTokenForUser(userId: string, newToken: string): Promise<boolean> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(`
                DELETE FROM identity.tokens
                WHERE user_id = $1;
            `, [userId]);

            await client.query(`
                INSERT INTO identity.tokens (user_id, token)
                VALUES ($1, $2);
            `, [userId, newToken]);

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in upsertTokenForUser transaction:', error);
            return false;
        } finally {
            client.release();
        }
    }
}
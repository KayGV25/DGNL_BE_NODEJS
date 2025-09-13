// Query to PostGreSQL for user data
import pool from "../database/sql";
import { RegisterRequest, UserCredentials, UserInfo } from "../interfaces/user";
import { RoleType } from "../models/identity";

export const userRepository = {
    async getUserById(userId: string): Promise<UserInfo | null> {
        const client = await pool.connect();
        try {
            const query = `SELECT username, gender_id, role_id, token, grade_lv, email, dob, avatar_url FROM identity.users WHERE id = $1;`;
            const result = await client.query(query, [userId]);
            if (result.rows.length === 0) return null;
            const user: UserInfo = result.rows[0] as UserInfo;
            return user;
        } finally {
            client.release();
        }
    },

    async getUserCredentialsByUsernameOrEmail(usernameOrEmail: string): Promise<UserCredentials | null> {
        const client = await pool.connect();
        try {
            const query = `
                        SELECT
                            u.id,
                            u.username,
                            u.password,
                            u.email,
                            u.is_enable,
                            t.token
                        FROM
                            identity.users AS u
                        LEFT JOIN
                            identity.tokens AS t ON u.id = t.user_id
                        WHERE
                            u.username = $1 OR u.email = $1;`;
            const result = await client.query(query, [usernameOrEmail])
            if (result.rows.length === 0) return null;
            const userCredentials: UserCredentials = result.rows[0] as UserCredentials
            return userCredentials;
        } finally {
            client.release();
        }
    },

    async createUser(user: RegisterRequest): Promise<string> {
        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO identity.users (
                    username, 
                    email, 
                    password, 
                    role_id
                )
                VALUES ($1, $2, $3, $4)
                RETURNING id;
            `;
            const values = [
                user.username,
                user.email,
                user.password,
                user.role
            ];
            const result = await client.query(query, values);
            const newUserId = result.rows[0].id;
            return newUserId;
        } catch (err) {
            console.error("❌ Error inserting user:", err);
            throw err; // Let service layer decide how to handle
        } finally {
            client.release();
        }
    },

    async checkIfEmailExists(email: string): Promise<boolean> {
        const client = await pool.connect();
        try {
            const query = `SELECT COUNT(*) FROM identity.users WHERE email = $1;`;
            const result = await client.query(query, [email]);
            // The count will be 0 if the email doesn't exist, and 1 or more if it does.
            return result.rows[0].count > 0;
        } finally {
            client.release();
        }
    },

    async enableAccountAndSetJWTToken(userId: string, jwtToken: string): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN'); // Start a transaction

            // Query to update the user's isEnalbled status
            const updateUserQuery = `
                UPDATE identity.users
                SET is_enable = TRUE
                WHERE id = $1;
            `;
            await client.query(updateUserQuery, [userId]);

            // Query to upsert the JWT token (update or insert)
            const upsertTokenQuery = `
                INSERT INTO identity.tokens (user_id, token)
                VALUES ($1, $2)
                ON CONFLICT (user_id) DO UPDATE
                SET token = EXCLUDED.token;
            `;
            await client.query(upsertTokenQuery, [userId, jwtToken]);

            await client.query('COMMIT'); // Commit the transaction
        } catch (error) {
            await client.query('ROLLBACK'); // Roll back if an error occurs
            throw error;
        } finally {
            client.release();
        }
    },

    async getUserRole(userId: string): Promise<RoleType | null> {
        const client = await pool.connect();
        try {
            const query = `
                        SELECT
                            u.role_id
                        FROM
                            identity.users as u
                        WHERE
                            u.id = $1;`;
            const result = await client.query(query, [userId]);
            if (result.rows.length === 0) return null;
            const role: RoleType = result.rows[0].role_id as RoleType
            return role;
        } finally {
            client.release()
        }
    }
}
// Query to PostGreSQL for user data
import pool from "../database/sql";
import { User } from "../models/identity";

export interface UserInfo extends Pick<User,
    "username" |
    "email" |
    "gender" |
    "role" |
    "dateOfBirth" |
    "token" |
    "grade" |
    "avatarUrl"> {}

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
}
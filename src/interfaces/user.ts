import { JWTToken, User } from "../models/identity";

export type UserInfo = Pick<User,
    "username" |
    "email" |
    "gender_id" |
    "role_id" |
    "dob" |
    "coins" |
    "grade_lv" |
    "avatar_url" |
    "is_enable">;

export type UserCredentials = 
    Pick<User,
        "id" |
        "username" |
        "password" |
        "email" |
        "is_enable"> &
    Pick<JWTToken, "token">;

export type LoginRequest = {
    emailOrusername: string
    password: string
}

export type RegisterRequest = {
    username: string,
    email: string,
    password: string,
    role: number
}
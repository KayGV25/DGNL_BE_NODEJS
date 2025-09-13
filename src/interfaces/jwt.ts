import { RoleType } from "../models/identity";

export type JWTConfig = {
    jwtSecret: string;
    expiresIn: number;
}

export type JWTTokenResponse = {
    user_id: string,
    token: string
}

export type JWTPayload = {
    payload: {
        userId: string;
        roleId: RoleType;
    }
}
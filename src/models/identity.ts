export interface User {
    id: string;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    gender: number;
    role: number;
    dob: Date | null;
    token: number;
    grade_lv: number;
    avatar_url: string;
    is_enable: boolean;
}

export interface JWTToken {
    id: number;
    user_id: User;
    token: string | null;
}

export enum GenderType {
    MALE = 1,
    FEMALE = 2,
    OTHER = 3
}

export enum RoleType {
    ADMIN = 1,
    TEACHER = 2,
    USER = 3
}

export default 0;
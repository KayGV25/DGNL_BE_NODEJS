export interface User {
    id: string;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    gender: number;
    role: number;
    dateOfBirth: Date | null;
    token: number;
    grade: number;
    avatarUrl: string;
    isEnalbled: boolean;
}

export interface JWTToken {
    id: number;
    user: User;
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
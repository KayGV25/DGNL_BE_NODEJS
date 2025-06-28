export interface User {
    id: number;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    gender: Gender | null;
    role: Role | null;
    dateOfBirth: Date | null;
    token: number;
    grade: number;
    avatarUrl: string;
    isEnalbled: boolean;
}

export interface Gender {
    id: number;
    genderType: string;
}

export interface Role {
    id: number;
    roleName: string;
}

export interface JWTToken {
    id: number;
    user: User;
    token: string;
}

export default 0;
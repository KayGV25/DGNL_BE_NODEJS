export type EmailContext = {
    [key: string]: unknown;
}

export interface EmailError extends Error {
    code?: string;
}
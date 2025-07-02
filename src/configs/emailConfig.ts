interface EmailConfig {
    host: string;
    port: number;
    email: string;
    password: string;
}

export const emailConfig: EmailConfig = {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    email: process.env.EMAIL_USERNAME || "abc@gmail.com",
    password: process.env.EMAIL_PASSWORD || "1234567890"
}
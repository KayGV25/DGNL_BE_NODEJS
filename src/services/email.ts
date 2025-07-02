import nodemailer, { Transporter } from "nodemailer";
import { emailConfig } from "../configs/emailConfig";
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

interface EmailContext {
    [key: string]: any;
}

class EmailService {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            auth: {
                user: emailConfig.email,
                pass: emailConfig.password
            }
        });

        this.transporter.verify((error, success) => {
            if (error) {
                console.error('Nodemailer configuration error:', error);
            } else {
                console.log('Nodemailer ready to send emails.');
            }
        });
    }

    private async compileTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
        const templatePath = path.resolve(__dirname, `../templates/${templateName}.hbs`);
        const source = await fs.promises.readFile(templatePath, 'utf8');
        return handlebars.compile(source);
    }

    public async sendEmail(to: string, subject: string, templateName: string, context: EmailContext): Promise<void> {
        try {
            const template = await this.compileTemplate(templateName);

            // Add common context variables (e.g., current year)
            const finalContext = {
                ...context,
                currentYear: new Date().getFullYear(),
            };

            const htmlContent = template(finalContext);

            const mailOptions = {
                from: process.env.EMAIL_USER, // Sender address
                to: to,                     // Recipient address
                subject: subject,           // Subject line
                html: htmlContent,          // HTML body
                // text: "Plain text version of the email (good for fallback)", // Optional: plain text version
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: %s', info.messageId);
            // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Only for ethereal.email testing
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email.'); // Re-throw to handle in calling function
        }
    }
}

export const emailService = new EmailService();
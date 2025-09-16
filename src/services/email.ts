import nodemailer, { Transporter } from "nodemailer";
import { emailConfig } from "../configs/emailConfig";
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { EmailContext } from "../interfaces/email";
import serverConfig from "../configs/serverConfig";

class EmailService {
    private transporter: Transporter;

    constructor(transporter?: Transporter) {
        // Allow custom transporter for tests
        this.transporter = transporter || nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            auth: {
                user: emailConfig.email,
                pass: emailConfig.password,
            },
        });

        this.transporter.verify((error, success) => {
            if (error) {
                console.error("Nodemailer configuration error:", error);
            }

            if (success) {
                console.log("Nodemailer ready to send emails.");
            }
        });
    }

    private async compileTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
        const templatePath = path.resolve(__dirname, `../templates/${templateName}.hbs`);
        const source = await fs.promises.readFile(templatePath, 'utf8');
        return handlebars.compile(source);
    }

    public async sendEmail(email: string, subject: string, templateName: string, context: EmailContext): Promise<void> {
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
                to: email,                     // Recipient address
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

    public async sendActivateAccountEmail(email: string, activationToken: string, userId: string) {
        const activationLink = `${serverConfig.url}/api/public/authentication/activate_email?id=${userId}&activation_token=${activationToken}&email=${email}`;
        this.sendEmail(
            email, 
            "Activate your account", 
            "ActivateAccountMail", 
            { "activation_link": activationLink }
        )
    }

    public async sendOTPEmail(email: string, otp: string) {
        this.sendEmail(
            email,
            "Your OTP",
            "OTPMail",
            { otp: otp }
        )
    }
}

export const emailService = new EmailService();
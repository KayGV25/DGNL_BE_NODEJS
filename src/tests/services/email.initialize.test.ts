import fs from "fs";
import handlebars from "handlebars";

// Mock modules
jest.mock("fs", () => ({
    promises: {
        readFile: jest.fn(),
    },
}));

jest.mock("handlebars", () => ({
    compile: jest.fn(),
}));

describe("emailService", () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => { });
        (fs.promises.readFile as jest.Mock).mockImplementation((filePath: string) => {
            console.log('Reading file:', filePath);
            return Promise.resolve("template content {{value}} {{activation_link}} {{otp}}");
        });

        (handlebars.compile as jest.Mock).mockImplementation((source: string) => {
            console.log('Compiling template with source:', source);
            return (context: any) => {
            console.log('Template executed with context:', context);
            return `HTML with ${context.value || context.activation_link || context.otp}`;
            };
        });
        
        // Set up EMAIL_USER env var
        process.env.EMAIL_USER = "test@sender.com";
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetModules();
    });

    describe("initialization with successful verification", () => {
        beforeAll(() => {
            // Set up successful verification before importing
            process.env.NODE_ENV = 'test';
        });

        it("should log success message when verification succeeds", async () => {
            const { setVerificationSuccess, resetVerificationMock, mockTransporter } =
                await import("../__mocks__/nodemailer");

            resetVerificationMock();
            setVerificationSuccess(true);

            const { emailService } = await import("../../services/email");

            expect(mockTransporter.verify).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith("Nodemailer ready to send emails.");
        });
    });

    describe("initialization with failed verification", () => {
        it("should log error message when verification fails", async () => {
            const { setVerificationSuccess, resetVerificationMock, mockTransporter } =
                await import("../__mocks__/nodemailer");

            resetVerificationMock();
            const verificationError = new Error("SMTP connection failed");
            setVerificationSuccess(false, verificationError);

            const { emailService } = await import("../../services/email");

            expect(mockTransporter.verify).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith("Nodemailer configuration error:", verificationError);
        });
    });
});
import { emailService } from "../../services/email";
import fs from "fs";
import handlebars from "handlebars";
import serverConfig from "../../configs/serverConfig";
import { mockTransporter, resetVerificationMock } from "../__mocks__/nodemailer";

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock("handlebars", () => ({
  compile: jest.fn(),
}));

describe("emailService send methods", () => {
  let sendMailMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    resetVerificationMock();

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    sendMailMock = mockTransporter.sendMail;

    (fs.promises.readFile as jest.Mock).mockResolvedValue("template content");
    process.env.EMAIL_USER = "test@sender.com";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sendEmail calls transporter with correct options and adds currentYear", async () => {
    (handlebars.compile as jest.Mock).mockReturnValue((context: any) =>
      `HTML with ${context.value} ${context.currentYear}`
    );

    await emailService.sendEmail("test@a.com", "Subject", "TemplateName", { value: "val" });

    expect(fs.promises.readFile).toHaveBeenCalled();
    expect(handlebars.compile).toHaveBeenCalledWith("template content");
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "test@sender.com",
        to: "test@a.com",
        subject: "Subject",
        html: expect.stringContaining("val"),
      })
    );
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining(new Date().getFullYear().toString())
    }));
  });

  it("sendActivateAccountEmail builds link and calls sendEmail", async () => {
    const sendEmailSpy = jest.spyOn(emailService, "sendEmail").mockResolvedValue(undefined);

    await emailService.sendActivateAccountEmail("a@b.com", "token123", "user123");

    expect(sendEmailSpy).toHaveBeenCalledWith(
      "a@b.com",
      "Activate your account",
      "ActivateAccountMail",
      expect.objectContaining({
        activation_link: `${serverConfig.url}/api/public/authentication/activate_email?id=user123&activation_token=token123&email=a@b.com`,
      })
    );
  });

  it("sendOTPEmail calls sendEmail with OTP template", async () => {
    const sendEmailSpy = jest.spyOn(emailService, "sendEmail").mockResolvedValue(undefined);

    await emailService.sendOTPEmail("a@b.com", "123456");

    expect(sendEmailSpy).toHaveBeenCalledWith(
      "a@b.com",
      "Your OTP",
      "OTPMail",
      expect.objectContaining({ otp: "123456" })
    );
  });

  it("sendEmail logs messageId on success", async () => {
    (handlebars.compile as jest.Mock).mockReturnValue(() => "<html/>");
    sendMailMock.mockResolvedValueOnce({ messageId: "abc123" });

    await emailService.sendEmail("a@b.com", "Subject", "TemplateName", {});

    expect(consoleLogSpy).toHaveBeenCalledWith("Email sent: %s", "abc123");
  });

  it("sendEmail throws error if transporter fails", async () => {
    (handlebars.compile as jest.Mock).mockReturnValue(() => "<html/>");
    sendMailMock.mockRejectedValueOnce(new Error("SMTP error"));

    await expect(
      emailService.sendEmail("a@b.com", "Subject", "TemplateName", {})
    ).rejects.toThrow("Failed to send email.");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error sending email:", expect.any(Error));
  });
});

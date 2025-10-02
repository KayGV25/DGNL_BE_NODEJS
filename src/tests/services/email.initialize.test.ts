import { emailService } from "../../services/email";
import { mockTransporter, resetVerificationMock, setVerificationSuccess } from "../__mocks__/nodemailer";

describe("emailService initialization", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    process.env.EMAIL_USER = "test@sender.com";
    resetVerificationMock();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("logs success when transporter verification succeeds", async () => {
    setVerificationSuccess(true);

    await emailService.init();

    expect(mockTransporter.verify).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("Nodemailer ready to send emails.");
  });

  it("logs error when transporter verification fails", async () => {
    const verificationError = new Error("SMTP connection failed");
    setVerificationSuccess(false, verificationError);

    await expect(emailService.init()).rejects.toThrow(verificationError);

    expect(mockTransporter.verify).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Nodemailer configuration error:", verificationError);
  });
});
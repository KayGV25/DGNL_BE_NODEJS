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

describe("emailService initialization", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    process.env.EMAIL_USER = "test@sender.com";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("logs success when transporter verification succeeds", async () => {
    const { setVerificationSuccess, resetVerificationMock, mockTransporter } =
      await import("../__mocks__/nodemailer");

    resetVerificationMock();
    setVerificationSuccess(true);

    await import("../../services/email");

    expect(mockTransporter.verify).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("Nodemailer ready to send emails.");
  });

  it("logs error when transporter verification fails", async () => {
    const { setVerificationSuccess, resetVerificationMock, mockTransporter } =
      await import("../__mocks__/nodemailer");

    resetVerificationMock();
    const verificationError = new Error("SMTP connection failed");
    setVerificationSuccess(false, verificationError);

    await import("../../services/email");

    expect(mockTransporter.verify).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Nodemailer configuration error:", verificationError);
  });
});
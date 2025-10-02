// src/tests/mocks/nodemailer.ts
let shouldVerifySucceed = true;
let verifyError: Error | null = null;

const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue({ messageId: "123" }),
  verify: jest.fn().mockImplementation((callback?: (err: Error | null, success: boolean) => void) => {
    if (callback) {
      // Callback style
      if (shouldVerifySucceed) {
        callback(null, true);
      } else {
        callback(verifyError || new Error("Verification failed"), false);
      }
    } else {
      // Promise style
      return shouldVerifySucceed
        ? Promise.resolve(true)
        : Promise.reject(verifyError || new Error("Verification failed"));
    }
  }),
};

const nodemailerMock = {
  createTransport: jest.fn(() => mockTransporter),
  getTestMessageUrl: jest.fn(),
};

// Helper functions to control the mock behavior
const setVerificationSuccess = (success: boolean, error?: Error) => {
  shouldVerifySucceed = success;
  verifyError = error || null;
};

const resetVerificationMock = () => {
  shouldVerifySucceed = true;
  verifyError = null;
  mockTransporter.verify.mockClear();
  mockTransporter.sendMail.mockClear();
};

export { mockTransporter, setVerificationSuccess, resetVerificationMock };
export default nodemailerMock;

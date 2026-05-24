/**
 * Integration tests for Email utility functions.
 * These tests verify the email utility without actually sending emails.
 */
import {
  sendApprovalEmail,
  sendPermissionLetterNotification,
  sendNoDueClearanceNotification,
  testEmailConnection,
} from "../src/utils/email";

// Mock nodemailer to prevent actual email sending
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-msg-id" }),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

describe("Email Utility", () => {
  describe("sendApprovalEmail", () => {
    it("should return boolean (true/false)", async () => {
      const result = await sendApprovalEmail("test@example.com", "Approver Name", "Student Name", 1, 1, "APP001", "Test College");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("sendPermissionLetterNotification", () => {
    it("should return boolean", async () => {
      const result = await sendPermissionLetterNotification("test@example.com", "Student Name", "APP001", "PL001", "Test College");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("sendNoDueClearanceNotification", () => {
    it("should return boolean", async () => {
      const result = await sendNoDueClearanceNotification("test@example.com", "Student Name", "APP001", "ND001");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("testEmailConnection", () => {
    it("should return connection status object", async () => {
      const result = await testEmailConnection();
      expect(result).toHaveProperty("ok");
      expect(result).toHaveProperty("message");
    });
  });
});

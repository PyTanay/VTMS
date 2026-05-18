import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.gnfc.in',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"VTMS Portal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const generateApprovalLink = (applicationId: number, approverId: number, action: 'approve' | 'reject') => {
  const payload = { applicationId, approverId, action };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '48h' });
  const baseUrl = process.env.SERVER_URL || 'http://localhost:3000';
  
  return `${baseUrl}/api/applications/${applicationId}/${action}?token=${token}`;
};

export const sendApprovalEmail = async (to: string, approverName: string, studentName: string, applicationId: number, approverId: number) => {
  const approveLink = generateApprovalLink(applicationId, approverId, 'approve');
  const rejectLink = generateApprovalLink(applicationId, approverId, 'reject');

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Vocational Training Request Approval</h2>
      <p>Dear ${approverName},</p>
      <p>A new vocational training request has been submitted for <strong>${studentName}</strong> and requires your approval.</p>
      
      <div style="margin: 30px 0;">
        <a href="${approveLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 15px;">Approve</a>
        <a href="${rejectLink}" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reject</a>
      </div>
      
      <p><em>Note: These links will expire in 48 hours and can only be used once.</em></p>
      <p>Regards,<br/>VTMS System</p>
    </div>
  `;

  return sendEmail(to, `Action Required: Vocational Training Request for ${studentName}`, html);
};

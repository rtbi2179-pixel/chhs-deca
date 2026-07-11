import nodemailer from 'nodemailer';

// Configure your email service here
// Using Manus built-in email service
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@chhs-deca.com',
      to: email,
      subject: 'Verify your CHHS DECA account',
      html: `
        <h2>Welcome to CHHS DECA!</h2>
        <p>Please verify your email address to complete your account setup.</p>
        <p><a href="${verificationUrl}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function sendTwoFactorEmail(email: string, code: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@chhs-deca.com',
      to: email,
      subject: 'Your CHHS DECA verification code',
      html: `
        <h2>Two-Factor Authentication</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 5px; font-family: monospace;">${code}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending 2FA email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@chhs-deca.com',
      to: email,
      subject: 'Reset your CHHS DECA password',
      html: `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetUrl}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

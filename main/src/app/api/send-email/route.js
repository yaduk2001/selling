import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { to, subject, html, text, from } = await request.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
    }

    // Check if Gmail SMTP credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Gmail SMTP credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured. Please add EMAIL_USER and EMAIL_PASS to environment variables.' },
        { status: 500 }
      );
    }

    // Create Nodemailer transporter with Gmail SMTP (FREE!)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // This should be an App Password, not regular password
      },
    });

    // Verify connection
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Email service connection failed. Please check your Gmail SMTP credentials.' },
        { status: 500 }
      );
    }

    // Prepare email options
    const mailOptions = {
      from: from || `"Selling Infinity" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
    };

    // Add content (prefer HTML over text)
    if (html) {
      mailOptions.html = html;
    }
    if (text) {
      mailOptions.text = text;
    }

    // Send email using Nodemailer
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully to ${to}`, info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your Gmail App Password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

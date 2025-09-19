import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/context/ToastContext';
import { Mail, Send, Save, Eye, Edit, Settings, User, Clock, Calendar, Zap } from 'lucide-react';

const EmailTemplateManager = () => {
  const { success, error: showError, warning } = useToast();
  const [initialTemplates] = useState({
    booking_confirmation: {
      name: 'Booking Confirmation',
      subject: '🎉 Your Coaching Session is Confirmed - {{customer_name}}',
      html_content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Session Confirmed!</h1>
    <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Get ready for your coaching session</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {{customer_name}},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Great news! Your coaching session has been confirmed. Here are your booking details:
    </p>
    
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">📅 Session Details</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>Date:</strong> {{booking_date}}</div>
        <div><strong>Time:</strong> {{booking_time}}</div>
        <div><strong>Service:</strong> {{service_name}}</div>
        <div><strong>Duration:</strong> {{duration}} minutes</div>
        <div><strong>Meeting Link:</strong> <a href="{{meeting_link}}" style="color: #f97316;">{{meeting_link}}</a></div>
      </div>
    </div>
    
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="color: #065f46; margin: 0 0 10px 0;">💡 Prepare for Success</h4>
      <ul style="color: #047857; margin: 0; padding-left: 20px;">
        <li>Have your questions ready</li>
        <li>Find a quiet space for the call</li>
        <li>Test your internet connection</li>
        <li>Bring a notepad for insights</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      I'm excited to work with you! If you have any questions or need to reschedule, please don't hesitate to reach out.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{reschedule_link}}" style="display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Manage Booking
      </a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Best regards,<br>
      <strong>Selling Infinity Team</strong>
    </p>
  </div>
</div>`,
      template_type: 'booking',
      placeholders: {
        customer_name: 'Customer Name',
        booking_date: 'Booking Date',
        booking_time: 'Booking Time',
        service_name: 'Service Name',
        duration: 'Duration',
        meeting_link: 'Meeting Link',
        reschedule_link: 'Reschedule Link'
      }
    },
    account_suspended: {
      name: 'Account Suspended',
      subject: '⚠️ Account Suspended - Action Required',
      html_content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Account Suspended</h1>
    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Important notice regarding your account</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {{customer_name}},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      We are writing to inform you that your account has been temporarily suspended due to a violation of our terms of service.
    </p>
    
    <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #dc2626; margin: 0 0 20px 0; font-size: 20px;">⚠️ Suspension Details</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>Reason:</strong> {{suspension_reason}}</div>
        <div><strong>Duration:</strong> {{suspension_duration}}</div>
        <div><strong>Date:</strong> {{suspension_date}}</div>
        <div><strong>Account:</strong> {{customer_email}}</div>
      </div>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="color: #92400e; margin: 0 0 10px 0;">📋 Next Steps</h4>
      <ul style="color: #b45309; margin: 0; padding-left: 20px;">
        <li>Review our terms of service</li>
        <li>Contact support if you believe this is an error</li>
        <li>Your account will be automatically reactivated after the suspension period</li>
        <li>Future violations may result in permanent account termination</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      If you have any questions or concerns about this suspension, please contact our support team immediately.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{support_link}}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Contact Support
      </a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Best regards,<br>
      <strong>Selling Infinity Support Team</strong>
    </p>
  </div>
</div>`,
      template_type: 'account',
      placeholders: {
        customer_name: 'Customer Name',
        customer_email: 'Customer Email',
        suspension_reason: 'Suspension Reason',
        suspension_duration: 'Suspension Duration',
        suspension_date: 'Suspension Date',
        support_link: 'Support Link'
      }
    },
    welcome_new_user: {
      name: 'Welcome New User',
      subject: '🎉 Welcome to Selling Infinity - Let\'s Get Started!',
      html_content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Selling Infinity!</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 16px;">Your journey to success starts here</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {{customer_name}},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Welcome to Selling Infinity! We're thrilled to have you join our community of successful entrepreneurs and sales professionals.
    </p>
    
    <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #166534; margin: 0 0 20px 0; font-size: 20px;">🚀 What's Next?</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>Complete Your Profile:</strong> Add your details to get personalized recommendations</div>
        <div><strong>Explore Services:</strong> Browse our coaching and training programs</div>
        <div><strong>Book Your First Session:</strong> Schedule a consultation to discuss your goals</div>
        <div><strong>Join Our Community:</strong> Connect with like-minded professionals</div>
      </div>
    </div>
    
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="color: #1e40af; margin: 0 0 10px 0;">💡 Getting Started Tips</h4>
      <ul style="color: #1d4ed8; margin: 0; padding-left: 20px;">
        <li>Set clear goals for your sales journey</li>
        <li>Take advantage of our free resources</li>
        <li>Book a discovery call to discuss your needs</li>
        <li>Follow us on social media for daily tips</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      We're here to support you every step of the way. Don't hesitate to reach out if you have any questions!
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{dashboard_link}}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 10px;">
        Go to Dashboard
      </a>
      <a href="{{booking_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Book a Session
      </a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Best regards,<br>
      <strong>Selling Infinity Team</strong>
    </p>
  </div>
</div>`,
      template_type: 'welcome',
      placeholders: {
        customer_name: 'Customer Name',
        dashboard_link: 'Dashboard Link',
        booking_link: 'Booking Link'
      }
    },
    promotional_offer: {
      name: 'Promotional Offer',
      subject: '🎯 Special Offer Just for You - {{customer_name}}!',
      html_content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Special Offer Inside!</h1>
    <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Limited time opportunity</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {{customer_name}},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      We have an exclusive offer that we think you'll love! As a valued member of our community, you get special access to this limited-time promotion.
    </p>
    
    <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 24px;">🎯 {{offer_title}}</h3>
      <div style="font-size: 32px; color: #dc2626; font-weight: bold; margin: 20px 0;">
        {{discount_amount}}
      </div>
      <p style="color: #b45309; font-size: 18px; margin: 0;">
        {{offer_description}}
      </p>
    </div>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="color: #065f46; margin: 0 0 10px 0;">✨ What You Get</h4>
      <ul style="color: #047857; margin: 0; padding-left: 20px;">
        <li>{{benefit_1}}</li>
        <li>{{benefit_2}}</li>
        <li>{{benefit_3}}</li>
        <li>Plus exclusive bonus materials</li>
      </ul>
    </div>
    
    <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
      <p style="color: #dc2626; font-weight: bold; margin: 0;">
        ⏰ This offer expires on {{expiry_date}}
      </p>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Don't miss out on this incredible opportunity to accelerate your success!
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{offer_link}}" style="display: inline-block; background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
        Claim Your Offer Now
      </a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Best regards,<br>
      <strong>Selling Infinity Team</strong>
    </p>
  </div>
</div>`,
      template_type: 'promotional',
      placeholders: {
        customer_name: 'Customer Name',
        offer_title: 'Offer Title',
        discount_amount: 'Discount Amount',
        offer_description: 'Offer Description',
        benefit_1: 'Benefit 1',
        benefit_2: 'Benefit 2',
        benefit_3: 'Benefit 3',
        expiry_date: 'Expiry Date',
        offer_link: 'Offer Link'
      }
    },
    booking_reminder: {
      name: 'Session Reminder',
      subject: '⏰ Reminder: Your coaching session is tomorrow - {customerName}',
      content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Session Reminder</h1>
    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Your coaching session is coming up!</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {customerName},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      This is a friendly reminder that your coaching session is scheduled for tomorrow. Here are the details:
    </p>
    
    <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px;">📅 Tomorrow's Session</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>Date:</strong> {sessionDate}</div>
        <div><strong>Time:</strong> {sessionTime}</div>
        <div><strong>Service:</strong> {productName}</div>
        <div><strong>Meeting Link:</strong> <a href="{meetingLink}" style="color: #f59e0b;">{meetingLink}</a></div>
      </div>
    </div>
    
    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="color: #1e40af; margin: 0 0 10px 0;">🚀 Quick Prep Checklist</h4>
      <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
        <li>Review your goals for the session</li>
        <li>Prepare your questions</li>
        <li>Test your microphone and camera</li>
        <li>Join 5 minutes early</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Looking forward to our session! See you tomorrow.
    </p>
  </div>
</div>`
    },
    session_cancelled: {
      name: 'Session Cancelled',
      subject: '❌ Session Cancelled - {customerName}',
      content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Session Cancelled</h1>
    <p style="color: #fca5a5; margin: 10px 0 0 0; font-size: 16px;">We're sorry for any inconvenience</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {customerName},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      I need to inform you that your coaching session has been cancelled:
    </p>
    
    <div style="background: #fef2f2; border: 2px solid #f87171; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #dc2626; margin: 0 0 20px 0; font-size: 20px;">❌ Cancelled Session</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>Original Date:</strong> {sessionDate}</div>
        <div><strong>Original Time:</strong> {sessionTime}</div>
        <div><strong>Service:</strong> {productName}</div>
        <div><strong>Reason:</strong> {cancellationReason}</div>
      </div>
    </div>
    
    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
      <h4 style="color: #0c4a6e; margin: 0 0 10px 0;">🔄 What's Next?</h4>
      <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
        <li>Full refund will be processed within 3-5 business days</li>
        <li>You can book a new session at your convenience</li>
        <li>Contact us if you need immediate assistance</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      I sincerely apologize for the inconvenience. Please feel free to reach out if you have any questions.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{bookingLink}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Book New Session
      </a>
    </div>
  </div>
</div>`
    },
    rescheduled: {
      name: 'Session Rescheduled',
      subject: '📅 Session Rescheduled - {customerName}',
      content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Session Rescheduled</h1>
    <p style="color: #86efac; margin: 10px 0 0 0; font-size: 16px;">New time confirmed</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {customerName},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Your coaching session has been successfully rescheduled. Here are your updated details:
    </p>
    
    <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #047857; margin: 0 0 20px 0; font-size: 20px;">📅 New Session Details</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>New Date:</strong> <span style="color: #059669;">{newSessionDate}</span></div>
        <div><strong>New Time:</strong> <span style="color: #059669;">{newSessionTime}</span></div>
        <div><strong>Service:</strong> {productName}</div>
        <div><strong>Meeting Link:</strong> <a href="{meetingLink}" style="color: #059669;">{meetingLink}</a></div>
      </div>
    </div>
    
    <div style="background: #f1f5f9; border: 2px solid #64748b; border-radius: 12px; padding: 20px; margin: 30px 0;">
      <h4 style="color: #475569; margin: 0 0 15px 0;">📋 Previous Details (for reference)</h4>
      <div style="color: #64748b; text-decoration: line-through;">
        <div>Original Date: {originalSessionDate}</div>
        <div>Original Time: {originalSessionTime}</div>
      </div>
    </div>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Thank you for your flexibility! Looking forward to our session at the new time.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{calendarLink}" style="display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Add to Calendar
      </a>
    </div>
  </div>
</div>`
    }
  });
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  // REMOVED: recipientEmail state - no longer needed since test email UI is removed
  const [sendingEmail, setSendingEmail] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateFormData, setTemplateFormData] = useState({
    key: '',
    name: '',
    subject: '',
    content: ''
  });

  // Sample data for preview
  const sampleData = {
    customer_name: 'John Smith',
    customer_email: 'john.smith@example.com',
    booking_date: 'August 21, 2025',
    booking_time: '2:00 PM',
    service_name: '1-on-1 Coaching Session',
    duration: '60',
    meeting_link: 'https://meet.google.com/abc-def-ghi',
    reschedule_link: 'https://yoursite.com/reschedule/123',
    booking_link: 'https://yoursite.com/book',
    dashboard_link: 'https://yoursite.com/dashboard',
    support_link: 'https://yoursite.com/support',
    suspension_reason: 'Terms of service violation',
    suspension_duration: '7 days',
    suspension_date: 'August 21, 2025',
    offer_title: '50% Off Premium Coaching',
    discount_amount: '50% OFF',
    offer_description: 'Get premium coaching at half price',
    benefit_1: 'Personalized coaching sessions',
    benefit_2: 'Exclusive training materials',
    benefit_3: 'Priority support access',
    expiry_date: 'August 31, 2025',
    offer_link: 'https://yoursite.com/special-offer',
    new_booking_date: 'August 25, 2025',
    new_booking_time: '3:00 PM',
    original_booking_date: 'August 21, 2025',
    original_booking_time: '2:00 PM',
    reschedule_reason: 'Due to a scheduling conflict on our end, we need to move your session to a more convenient time.'
  };


  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/email-templates');
        const data = await response.json();
        if (data.success && data.templates.length > 0) {
          const templatesObject = data.templates.reduce((acc, t) => {
            acc[t.id] = {
              name: t.name,
              subject: t.subject,
              html_content: t.html_content,
              template_type: t.template_type,
              placeholders: t.placeholders,
            };
            return acc;
          }, {});
          setTemplates(templatesObject);
        } else {
          setTemplates(initialTemplates);
          await saveTemplates(initialTemplates);
          info('Default templates have been initialized.');
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        showError('Could not load templates. Using default templates.');
        setTemplates(initialTemplates);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
    fetchUsers();
  }, [initialTemplates]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (templates && Object.keys(templates).length > 0 && selectedTemplate) {
      setCurrentTemplate(templates[selectedTemplate]);
    } else if (templates && Object.keys(templates).length > 0 && !selectedTemplate) {
      // Auto-select first template if none selected
      const firstTemplateId = Object.keys(templates)[0];
      setSelectedTemplate(firstTemplateId);
      setCurrentTemplate(templates[firstTemplateId]);
    }
  }, [selectedTemplate, templates]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates');
      const data = await response.json();
      if (data.success) {
        const templatesData = data.templates.reduce((acc, template) => {
          acc[template.template_key] = template;
          return acc;
        }, {});
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
  };

  const handleSubjectChange = (newSubject) => {
    setTemplates(prev => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        subject: newSubject
      }
    }));
  };

  const handleContentChange = (newContent) => {
    setTemplates(prev => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        html_content: newContent
      }
    }));
  };

  const replacePlaceholders = (text, data) => {
    if (typeof text !== 'string') {
      return '';
    }
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  };

  const getPreviewHtml = () => {
    return replacePlaceholders(currentTemplate?.html_content, sampleData);
  };

  const getPreviewSubject = () => {
    return replacePlaceholders(currentTemplate?.subject, sampleData);
  };

  // COMMENTED OUT: Send Test Email function - requires RESEND_API_KEY
  // const sendTestEmail = async () => {
  //   if (!recipientEmail) {
  //     warning('Please enter a recipient email');
  //     return;
  //   }

  //   setSendingEmail(true);
  //   try {
  //     // Create personalized email content for test
  //     const testUserName = recipientEmail.split('@')[0];
  //     const personalizedSubject = replacePlaceholders(currentTemplate?.subject || '', {
  //       customer_name: testUserName,
  //       customer_email: recipientEmail
  //     });

  //     const personalizedHtml = replacePlaceholders(currentTemplate?.html_content || '', {
  //       customer_name: testUserName,
  //       customer_email: recipientEmail,
  //       booking_date: 'August 21, 2025',
  //       booking_time: '2:00 PM',
  //       service_name: '1-on-1 Coaching Session',
  //       duration: '60',
  //       meeting_link: 'https://meet.google.com/abc-def-ghi',
  //       reschedule_link: 'https://yoursite.com/reschedule/123',
  //       booking_link: 'https://yoursite.com/book',
  //       dashboard_link: 'https://yoursite.com/dashboard',
  //       support_link: 'https://yoursite.com/support'
  //     });

  //     const response = await fetch('/api/admin/send-template-email', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         to: recipientEmail,
  //         subject: personalizedSubject,
  //         html: personalizedHtml,
  //         templateName: currentTemplate?.name
  //       })
  //     });

  //     const result = await response.json();
  //     if (result.success) {
  //       success('Test email sent successfully!');
  //       setRecipientEmail('');
  //     } else {
  //       if (result.error.includes('not configured')) {
  //         warning('Email service not configured. Please contact your administrator to set up RESEND_API_KEY.');
  //       } else {
  //         showError('Failed to send email: ' + result.error);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error sending email:', error);
  //     showError('Network error sending email. Please try again.');
  //   } finally {
  //     setSendingEmail(false);
  //   }
  // };

  const sendBulkEmail = async () => {
    if (selectedUsers.length === 0) {
      warning('Please select at least one user');
      return;
    }

    setSendingEmail(true);
    try {
      // Send individual emails to each user with their personal data
      let successCount = 0;
      let errorCount = 0;

      for (const user of selectedUsers) {
        try {
          // Create personalized email content for this user
          const personalizedSubject = replacePlaceholders(currentTemplate?.subject || '', {
            customer_name: user.name || user.full_name || user.email.split('@')[0],
            customer_email: user.email
          });

          // Create personalized sample data for this specific user
          const userSampleData = {
            customer_name: user.name || user.full_name || user.email.split('@')[0],
            customer_email: user.email,
            booking_date: 'August 21, 2025',
            booking_time: '2:00 PM',
            service_name: '1-on-1 Coaching Session',
            duration: '60',
            meeting_link: 'https://meet.google.com/abc-def-ghi',
            reschedule_link: 'https://yoursite.com/reschedule/123',
            booking_link: 'https://yoursite.com/book',
            dashboard_link: 'https://yoursite.com/dashboard',
            support_link: 'https://yoursite.com/support',
            suspension_reason: 'Terms of service violation',
            suspension_duration: '7 days',
            suspension_date: 'August 21, 2025',
            offer_title: '50% Off Premium Coaching',
            discount_amount: '50% OFF',
            offer_description: 'Get premium coaching at half price',
            benefit_1: 'Personalized coaching sessions',
            benefit_2: 'Exclusive training materials',
            benefit_3: 'Priority support access',
            expiry_date: 'August 31, 2025',
            offer_link: 'https://yoursite.com/special-offer',
            new_booking_date: 'August 25, 2025',
            new_booking_time: '3:00 PM',
            original_booking_date: 'August 21, 2025',
            original_booking_time: '2:00 PM',
            reschedule_reason: 'Due to a scheduling conflict on our end, we need to move your session to a more convenient time.'
          };

          const personalizedHtml = replacePlaceholders(currentTemplate?.html_content || '', userSampleData);

          const response = await fetch('/api/admin/send-template-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: user.email,
              subject: personalizedSubject,
              html: personalizedHtml,
              templateName: currentTemplate?.name
            })
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to send email to ${user.email}:`, result.error);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error sending email to ${user.email}:`, error);
        }
      }

      if (successCount > 0) {
        success(`Bulk email sent to ${successCount} users successfully!${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      } else {
        showError(`Failed to send emails to all ${selectedUsers.length} users`);
      }

      setSelectedUsers([]);
      setShowUserSelection(false);
    } catch (error) {
      showError('Error sending bulk email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendTomorrowReminders = async () => {
    setSendingEmail(true);
    try {
      const response = await fetch('/api/admin/send-session-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (result.success) {
        success(`Successfully sent ${result.sentCount} reminder email(s) for tomorrow's sessions!`);
      } else {
        showError('Failed to send reminders: ' + result.error);
      }
    } catch (error) {
      showError('Error sending reminders: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Helper functions for template field management
  const getTemplateField = (fieldName) => {
    if (!currentTemplate?.templateFields) return '';
    return currentTemplate.templateFields[fieldName] || '';
  };

  const updateTemplateField = (fieldName, value) => {
    const updatedTemplate = {
      ...currentTemplate,
      templateFields: {
        ...currentTemplate.templateFields,
        [fieldName]: value
      }
    };
    
    // Convert template fields to HTML
    updatedTemplate.html_content = generateHtmlFromFields(updatedTemplate.templateFields);
    
    setCurrentTemplate(updatedTemplate);
    setTemplates({ ...templates, [selectedTemplate]: updatedTemplate });
  };

  const generateHtmlFromFields = (fields) => {
    const greeting = fields.greeting || 'Hi {{customer_name}},';
    const mainMessage = fields.mainMessage || '';
    const ctaText = fields.ctaText || '';
    const ctaLink = fields.ctaLink || '';
    const footer = fields.footer || 'Best regards,\nSelling Infinity Team';

    let html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Selling Infinity</h1>
    <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Professional Coaching Services</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      ${greeting}
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      ${mainMessage.replace(/\n/g, '<br>')}
    </p>`;

    if (ctaText && ctaLink) {
      html += `
    <div style="text-align: center; margin: 40px 0;">
      <a href="${ctaLink}" style="display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        ${ctaText}
      </a>
    </div>`;
    }

    html += `
  </div>
  
  <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      ${footer.replace(/\n/g, '<br>')}
    </p>
  </div>
</div>`;

    return html;
  };

  // Preset content for different template types
  const getPresetContent = (templateType, templateName) => {
    const presets = {
      booking: {
        greeting: 'Hi {{customer_name}},',
        mainMessage: `Great news! Your coaching session has been confirmed. Here are your booking details:

📅 Session Details:
• Date: {{booking_date}}
• Time: {{booking_time}}
• Service: {{service_name}}
• Duration: {{duration}} minutes
• Meeting Link: {{meeting_link}}

💡 Prepare for Success:
• Have your questions ready
• Find a quiet space for the call
• Test your internet connection
• Bring a notepad for insights

I'm excited to work with you! If you have any questions or need to reschedule, please don't hesitate to reach out.`,
        ctaText: 'Manage Booking',
        ctaLink: '{{reschedule_link}}',
        footer: 'Best regards,\nSelling Infinity Team'
      },
      account: {
        greeting: 'Hi {{customer_name}},',
        mainMessage: `We are writing to inform you that your account has been temporarily suspended due to a violation of our terms of service.

⚠️ Suspension Details:
• Reason: {{suspension_reason}}
• Duration: {{suspension_duration}}
• Date: {{suspension_date}}
• Account: {{customer_email}}

📋 Next Steps:
• Review our terms of service
• Contact support if you believe this is an error
• Your account will be automatically reactivated after the suspension period
• Future violations may result in permanent account termination

If you have any questions or concerns about this suspension, please contact our support team immediately.`,
        ctaText: 'Contact Support',
        ctaLink: '{{support_link}}',
        footer: 'Best regards,\nSelling Infinity Support Team'
      },
      welcome: {
        greeting: 'Hi {{customer_name}},',
        mainMessage: `Welcome to Selling Infinity! We're thrilled to have you join our community of successful entrepreneurs and sales professionals.

🚀 What's Next:
• Complete Your Profile: Add your details to get personalized recommendations
• Explore Services: Browse our coaching and training programs
• Book Your First Session: Schedule a consultation to discuss your goals
• Join Our Community: Connect with like-minded professionals

💡 Getting Started Tips:
• Set clear goals for your sales journey
• Take advantage of our free resources
• Book a discovery call to discuss your needs
• Follow us on social media for daily tips

We're here to support you every step of the way. Don't hesitate to reach out if you have any questions!`,
        ctaText: 'Book a Session',
        ctaLink: '{{booking_link}}',
        footer: 'Best regards,\nSelling Infinity Team'
      },
      promotional: {
        greeting: 'Hi {{customer_name}},',
        mainMessage: `We have an exclusive offer that we think you'll love! As a valued member of our community, you get special access to this limited-time promotion.

🎯 {{offer_title}}
{{discount_amount}}
{{offer_description}}

✨ What You Get:
• {{benefit_1}}
• {{benefit_2}}
• {{benefit_3}}
• Plus exclusive bonus materials

⏰ This offer expires on {{expiry_date}}

Don't miss out on this incredible opportunity to accelerate your success!`,
        ctaText: 'Claim Your Offer Now',
        ctaLink: '{{offer_link}}',
        footer: 'Best regards,\nSelling Infinity Team'
      },
      reminder: {
        greeting: 'Hi {{customer_name}},',
        mainMessage: `This is a friendly reminder that your coaching session is scheduled for tomorrow:

📅 Session Details:
• Date: {{booking_date}}
• Time: {{booking_time}}
• Service: {{service_name}}
• Duration: {{duration}} minutes
• Meeting Link: {{meeting_link}}

💡 Preparation Tips:
• Test your internet connection
• Find a quiet space for the call
• Have your questions ready
• Bring a notepad for insights

Looking forward to our session! If you need to reschedule, please let me know as soon as possible.`,
        ctaText: 'Join Meeting',
        ctaLink: '{{meeting_link}}',
        footer: 'Best regards,\nSelling Infinity Team'
      },
      rescheduled: {
        greeting: 'Hi {{customer_name}},',
        mainMessage: `We wanted to inform you that your coaching session has been rescheduled.

📅 Updated Session Details:
• New Date: {{new_booking_date}}
• New Time: {{new_booking_time}}
• Service: {{service_name}}
• Duration: {{duration}} minutes
• Meeting Link: {{meeting_link}}

📋 Previous Session Details:
• Original Date: {{original_booking_date}}
• Original Time: {{original_booking_time}}

🔄 Reschedule Reason:
{{reschedule_reason}}

💡 What's Next:
• Your new session is confirmed and ready to go
• The meeting link remains the same
• If you need to make any changes, please contact us as soon as possible
• We apologize for any inconvenience this may cause

We look forward to our rescheduled session!`,
        ctaText: 'View Updated Booking',
        ctaLink: '{{booking_link}}',
        footer: 'Best regards,\nSelling Infinity Team'
      }
    };

    // Return preset based on template type or name
    if (presets[templateType]) {
      return presets[templateType];
    }

    // Fallback based on template name
    if (templateName?.toLowerCase().includes('booking')) {
      return presets.booking;
    } else if (templateName?.toLowerCase().includes('suspended') || templateName?.toLowerCase().includes('ban')) {
      return presets.account;
    } else if (templateName?.toLowerCase().includes('welcome')) {
      return presets.welcome;
    } else if (templateName?.toLowerCase().includes('promotional') || templateName?.toLowerCase().includes('offer')) {
      return presets.promotional;
    } else if (templateName?.toLowerCase().includes('reminder')) {
      return presets.reminder;
    } else if (templateName?.toLowerCase().includes('rescheduled') || templateName?.toLowerCase().includes('reschedule')) {
      return presets.rescheduled;
    }

    // Default preset
    return {
      greeting: 'Hi {{customer_name}},',
      mainMessage: 'Thank you for your interest in our services. We look forward to working with you!',
      ctaText: 'Learn More',
      ctaLink: '{{booking_link}}',
      footer: 'Best regards,\nSelling Infinity Team'
    };
  };

  // Initialize template fields when template changes
  useEffect(() => {
    if (currentTemplate && !currentTemplate.templateFields) {
      // Get preset content based on template type and name
      const presetContent = getPresetContent(currentTemplate.template_type, currentTemplate.name);
      
      const templateFields = {
        greeting: presetContent.greeting,
        mainMessage: presetContent.mainMessage,
        ctaText: presetContent.ctaText,
        ctaLink: presetContent.ctaLink,
        footer: presetContent.footer
      };

      const updatedTemplate = {
        ...currentTemplate,
        templateFields: templateFields
      };

      setCurrentTemplate(updatedTemplate);
      setTemplates({ ...templates, [selectedTemplate]: updatedTemplate });
    }
  }, [currentTemplate, selectedTemplate, templates]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleEditTemplate = (templateKey) => {
    const template = templates[templateKey];
    setTemplateFormData({ ...template, key: templateKey });
    setEditingTemplate(templateKey);
    setShowEditModal(true);
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    const url = '/api/admin/email-templates';
    const method = 'PUT';
    const body = {
      ...templateFormData,
      template_key: editingTemplate
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        success('Template updated successfully!');
        setShowEditModal(false);
        loadTemplates();
      } else {
        showError('Failed to update template.');
      }
    } catch (error) {
      showError('Error updating template: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Template: {templateFormData.name}</h3>
            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={templateFormData.subject}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Content (HTML)</label>
                <textarea
                  value={templateFormData.content}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
                  className="w-full h-64 p-2 bg-gray-700 border border-gray-600 text-white rounded font-mono text-sm"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Update Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Email Template Manager</h2>
        <p className="text-gray-300">Create and manage email templates for client communications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection and Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Select Template</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(templates).map(([templateId, template]) => (
                <button
                  key={templateId}
                  onClick={() => handleTemplateChange(templateId)}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    selectedTemplate === templateId
                      ? 'border-orange-500 bg-orange-900/20 text-orange-300'
                      : 'border-gray-600 hover:border-gray-500 text-gray-300 bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <div className="font-medium text-white">{template.name}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {template.template_type || 'General'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(templateId);
                      }}
                      className="text-blue-400 hover:text-blue-300 p-2"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Line Editor */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Subject Line</h3>
            <input
              type="text"
              value={currentTemplate?.subject || ''}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Email subject with {placeholders}"
            />
            <div className="mt-2 text-sm text-gray-400">
              Preview: <span className="font-medium text-white">{getPreviewSubject()}</span>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Email Content</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    previewMode
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {previewMode ? 'Edit HTML' : 'Preview'}
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <div className="bg-gray-700 p-3 border-b border-gray-600">
                  <div className="text-sm font-medium text-white">Email Preview</div>
                </div>
                <div 
                  className="p-4 h-96 overflow-y-auto bg-white"
                  dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subject Line Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={currentTemplate?.subject || ''}
                    onChange={(e) => {
                      const updatedTemplate = { ...currentTemplate, subject: e.target.value };
                      setCurrentTemplate(updatedTemplate);
                      setTemplates({ ...templates, [selectedTemplate]: updatedTemplate });
                    }}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter email subject (use {{customer_name}} for personalization)"
                  />
                </div>

                {/* Email Content Editor */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Email Content
                    </label>
                    <button
                      onClick={() => {
                        const presetContent = getPresetContent(currentTemplate?.template_type, currentTemplate?.name);
                        const updatedTemplate = {
                          ...currentTemplate,
                          templateFields: {
                            greeting: presetContent.greeting,
                            mainMessage: presetContent.mainMessage,
                            ctaText: presetContent.ctaText,
                            ctaLink: presetContent.ctaLink,
                            footer: presetContent.footer
                          }
                        };
                        updatedTemplate.html_content = generateHtmlFromFields(updatedTemplate.templateFields);
                        setCurrentTemplate(updatedTemplate);
                        setTemplates({ ...templates, [selectedTemplate]: updatedTemplate });
                      }}
                      className="px-3 py-1 text-xs bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
                    >
                      Reset to Default
                    </button>
                  </div>
                  <div className="space-y-3">
                    {/* Greeting */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Greeting</label>
                      <input
                        type="text"
                        value={getTemplateField('greeting') || 'Hi {{customer_name}},'}
                        onChange={(e) => updateTemplateField('greeting', e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                        placeholder="Hi {{customer_name}},"
                      />
                    </div>

                    {/* Main Message */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Main Message</label>
                      <textarea
                        value={getTemplateField('mainMessage') || ''}
                        onChange={(e) => updateTemplateField('mainMessage', e.target.value)}
                        rows={4}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                        placeholder="Enter your main message here..."
                      />
                    </div>

                    {/* Call to Action */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Call to Action Button</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={getTemplateField('ctaText') || ''}
                          onChange={(e) => updateTemplateField('ctaText', e.target.value)}
                          className="p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                          placeholder="Button text (e.g., Book Now)"
                        />
                        <input
                          type="text"
                          value={getTemplateField('ctaLink') || ''}
                          onChange={(e) => updateTemplateField('ctaLink', e.target.value)}
                          className="p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                          placeholder="Button link (e.g., {{booking_link}})"
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Footer Message</label>
                      <textarea
                        value={getTemplateField('footer') || 'Best regards,\nSelling Infinity Team'}
                        onChange={(e) => updateTemplateField('footer', e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                        placeholder="Best regards,\nSelling Infinity Team"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-300 mb-2">
                    Before Sending Your Email
                  </h4>
                  <div className="text-sm text-blue-200 space-y-2">
                    <p className="font-medium">Please review and customize the following details:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-100">
                      <li><strong>Subject Line:</strong> Ensure it's clear and engaging</li>
                      <li><strong>Greeting:</strong> Personalize with appropriate tone</li>
                      <li><strong>Main Content:</strong> Verify all information is accurate and relevant</li>
                      <li><strong>Call-to-Action:</strong> Make sure buttons and links are correct</li>
                      <li><strong>Footer:</strong> Confirm contact information and branding</li>
                    </ul>
                    <p className="text-blue-200 text-xs mt-3 p-2 bg-blue-800/20 rounded border border-blue-600/30">
                      <strong>💡 Tip:</strong> Use the "Reset to Default" button if you need to start over with the professional template content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">

          {/* Send to Selected Users */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Send to Selected Users</h3>
            <div className="mb-4">
              <button
                onClick={() => setShowUserSelection(!showUserSelection)}
                className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 font-medium mb-4"
              >
                {showUserSelection ? 'Hide User Selection' : 'Select Users'}
              </button>
              
              {showUserSelection && (
                <div className="max-h-64 overflow-y-auto border border-gray-600 rounded-lg bg-gray-700 p-4">
                  <div className="text-sm text-gray-300 mb-3">
                    Select users to send this email to:
                  </div>
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      className={`p-2 rounded cursor-pointer mb-2 transition-colors ${
                        selectedUsers.some(u => u.id === user.id)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      <div className="font-medium">{user.name || user.full_name || user.email}</div>
                      <div className="text-sm opacity-75">{user.email}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedUsers.length > 0 && (
                <div className="mt-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                  <div className="text-sm text-orange-300">
                    Selected {selectedUsers.length} user(s):
                  </div>
                  <div className="text-xs text-orange-400 mt-1">
                    {selectedUsers.map(u => u.email).join(', ')}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={sendBulkEmail}
              disabled={sendingEmail || selectedUsers.length === 0}
              className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {sendingEmail ? 'Sending...' : `Send to ${selectedUsers.length} Users`}
            </button>
          </div>


          {/* Quick Actions */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                📧 Send to All Active Clients
              </button>
              <button 
                onClick={handleSendTomorrowReminders}
                disabled={sendingEmail}
                className="w-full text-left p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? '⏳ Sending...' : '📅 Send Reminders for Tomorrow'}
              </button>
              <button className="w-full text-left p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                🔔 Notify About Schedule Changes
              </button>
            </div>
          </div>

          {/* Template Stats */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Template Usage</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Booking Confirmation</span>
                <span className="text-gray-400">47 sent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Session Reminder</span>
                <span className="text-gray-400">23 sent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Session Cancelled</span>
                <span className="text-gray-400">3 sent</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Rescheduled</span>
                <span className="text-gray-400">12 sent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateManager;

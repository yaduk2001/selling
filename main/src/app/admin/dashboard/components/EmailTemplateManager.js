import React, { useState, useEffect } from 'react';
import { useToast } from '@/app/context/ToastContext';
import { Mail, Send, Save, Eye, Edit, Settings, User, Clock, Calendar, Zap } from 'lucide-react';

const EmailTemplateManager = () => {
  const { success, error: showError, warning } = useToast();
  const [initialTemplates] = useState({
    booking_confirmation: {
      name: 'Booking Confirmation',
      subject: '🎉 Your Coaching Session is Confirmed - {customerName}',
      content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Session Confirmed!</h1>
    <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Get ready for your coaching session</p>
  </div>
  
  <div style="padding: 40px 20px;">
    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
      Hi {customerName},
    </p>
    
    <p style="font-size: 16px; color: #374151; line-height: 1.6;">
      Great news! Your coaching session has been confirmed. Here are your booking details:
    </p>
    
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">📅 Session Details</h3>
      <div style="display: grid; gap: 15px;">
        <div><strong>Date:</strong> {sessionDate}</div>
        <div><strong>Time:</strong> {sessionTime}</div>
        <div><strong>Service:</strong> {productName}</div>
        <div><strong>Duration:</strong> {duration} minutes</div>
        <div><strong>Meeting Link:</strong> <a href="{meetingLink}" style="color: #f97316;">{meetingLink}</a></div>
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
      <a href="{rescheduleLink}" style="display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Manage Booking
      </a>
    </div>
  </div>
  
  <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Best regards,<br>
      <strong>Your Coach</strong>
    </p>
  </div>
</div>`
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
  const [selectedTemplate, setSelectedTemplate] = useState('booking_confirmation');
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
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
    customerName: 'John Smith',
    sessionDate: 'August 21, 2025',
    sessionTime: '2:00 PM',
    productName: '1-on-1 Coaching Session',
    duration: '60',
    meetingLink: 'https://meet.google.com/abc-def-ghi',
    rescheduleLink: 'https://yoursite.com/reschedule/123',
    bookingLink: 'https://yoursite.com/book',
    calendarLink: 'https://calendar.google.com/add-event',
    cancellationReason: 'Scheduling conflict',
    originalSessionDate: 'August 20, 2025',
    originalSessionTime: '3:00 PM',
    newSessionDate: 'August 21, 2025',
    newSessionTime: '2:00 PM'
  };

  const saveTemplates = async (templatesToSave = templates) => {
    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: templatesToSave }),
      });

      const result = await response.json();
      if (result.success) {
        success('Templates saved successfully!');
        if (result.templates) {
          const templatesObject = result.templates.reduce((acc, t) => {
            acc[t.template_key] = {
              name: t.name,
              subject: t.subject,
              content: t.content,
            };
            return acc;
          }, {});
          setTemplates(templatesObject);
        }
      } else {
        showError('Failed to save templates: ' + result.error);
      }
    } catch (error) {
      showError('Error saving templates: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/email-templates');
        const data = await response.json();
        if (data.success && data.templates.length > 0) {
          const templatesObject = data.templates.reduce((acc, t) => {
            acc[t.template_key] = {
              name: t.name,
              subject: t.subject,
              content: t.content,
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
  }, [initialTemplates]);

  useEffect(() => {
    if (templates && Object.keys(templates).length > 0) {
      setCurrentTemplate(templates[selectedTemplate]);
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
        content: newContent
      }
    }));
  };

  const replacePlaceholders = (text, data) => {
    if (typeof text !== 'string') {
      return '';
    }
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  };

  const getPreviewHtml = () => {
    return replacePlaceholders(currentTemplate?.content, sampleData);
  };

  const getPreviewSubject = () => {
    return replacePlaceholders(currentTemplate?.subject, sampleData);
  };

  const sendTestEmail = async () => {
    if (!recipientEmail) {
      warning('Please enter a recipient email');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch('/api/admin/send-template-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: getPreviewSubject(),
          html: getPreviewHtml(),
          templateName: currentTemplate?.name
        })
      });

      const result = await response.json();
      if (result.success) {
        success('Email sent successfully!');
        setRecipientEmail('');
      } else {
        if (result.error.includes('not configured')) {
          warning('Email service not configured. Please contact your administrator to set up RESEND_API_KEY.');
        } else {
          showError('Failed to send email: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showError('Network error sending email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

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
              {Object.entries(templates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleTemplateChange(key)}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    selectedTemplate === key
                      ? 'border-orange-500 bg-orange-900/20 text-orange-300'
                      : 'border-gray-600 hover:border-gray-500 text-gray-300 bg-gray-700/50'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <div className="font-medium text-white">{template.name}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(key);
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
              <textarea
                value={currentTemplate?.content || ''}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-96 p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                placeholder="HTML email content with {placeholders}"
              />
            )}

            <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <h4 className="font-medium text-white mb-2">Available Placeholders:</h4>
              <div className="grid grid-cols-3 gap-2 text-sm text-gray-300">
                <div>{'{customerName}'}</div>
                <div>{'{sessionDate}'}</div>
                <div>{'{sessionTime}'}</div>
                <div>{'{productName}'}</div>
                <div>{'{duration}'}</div>
                <div>{'{meetingLink}'}</div>
                <div>{'{rescheduleLink}'}</div>
                <div>{'{bookingLink}'}</div>
                <div>{'{calendarLink}'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Send Test Email */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Send Test Email</h3>
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Email service requires RESEND_API_KEY configuration
              </p>
            </div>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-4"
              placeholder="Enter email address"
            />
            <button
              onClick={sendTestEmail}
              disabled={sendingEmail}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {sendingEmail ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>

          {/* Save Templates */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Save Changes</h3>
            <button
              onClick={saveTemplates}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium"
            >
              Save All Templates
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                📧 Send to All Active Clients
              </button>
              <button className="w-full text-left p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                📅 Send Reminders for Tomorrow
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

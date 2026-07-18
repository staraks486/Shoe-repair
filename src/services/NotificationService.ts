import { ShoeRepairRequest, Settings } from '../types';

export class NotificationService {
  static async sendStatusUpdateEmail(repair: ShoeRepairRequest, settings: Settings) {
    if (!repair.email) {
      console.warn(`[NotificationService] No email address provided for repair ticket ${repair.invoiceNumber}. Skipping email notification.`);
      return;
    }

    const subject = `[SIMULATED] Your shoe repair ${repair.invoiceNumber} is now ${repair.status}`;
    const body = `
--- SIMULATED NOTIFICATION ---
To: ${repair.email}

Dear ${repair.customerName},

We are writing to inform you that your shoe repair order (${repair.invoiceNumber}) for your ${repair.shoeModel} has been updated to: ${repair.status}.

${repair.status === 'Completed' ? `Great news! Your shoes are ready for pickup. 
Please visit the workshop at your earliest convenience.` : ''}

Thank you for choosing ${settings.storeName}!

Best regards,
The team at ${settings.storeName}
--- END SIMULATION ---
    `.trim();

    try {
      const response = await fetch('/api/notify/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: repair.email,
          subject,
          body
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      console.log(`[NotificationService] Successfully sent email to ${repair.email}`);
    } catch (error) {
      console.error(`[NotificationService] Failed to send email to ${repair.email}:`, error);
    }
  }

  static async sendStatusUpdateSms(repair: ShoeRepairRequest, settings: Settings) {
    if (!repair.receiveSmsUpdates || !repair.phoneNumber) {
      return;
    }

    const message = `[SIMULATED SMS] Hi ${repair.customerName}, your shoe repair (${repair.invoiceNumber}) is now ${repair.status}.${repair.status === 'Completed' ? ' READY FOR PICKUP!' : ''} - ${settings.storeName}`;

    try {
      const response = await fetch('/api/notify/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: repair.phoneNumber,
          message
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      console.log(`[NotificationService] Successfully sent SMS to ${repair.phoneNumber}`);
    } catch (error) {
      console.error(`[NotificationService] Failed to send SMS to ${repair.phoneNumber}:`, error);
    }
  }
}

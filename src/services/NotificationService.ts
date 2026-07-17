import { ShoeRepairRequest, Settings } from '../types';

export class NotificationService {
  static async sendStatusUpdateEmail(repair: ShoeRepairRequest, settings: Settings) {
    if (!repair.email) {
      console.warn(`[NotificationService] No email address provided for repair ticket ${repair.invoiceNumber}. Skipping email notification.`);
      return;
    }

    const subject = `Update on your shoe repair: ${repair.invoiceNumber} is now ${repair.status}`;
    const body = `
Dear ${repair.customerName},

We are writing to inform you that your shoe repair order (${repair.invoiceNumber}) for your ${repair.shoeModel} has been updated to: ${repair.status}.

${repair.status === 'Completed' ? `Great news! Your shoes are ready for pickup.
The remaining balance due is ₹${(repair.balance || 0).toFixed(2)}.` : ''}

Thank you for choosing ${settings.storeName}!

Best regards,
The team at ${settings.storeName}
${settings.address}
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

    const message = `Hi ${repair.customerName}, your shoe repair (${repair.invoiceNumber}) is now ${repair.status}.${repair.status === 'Completed' ? ` Ready for pickup! Balance: ₹${(repair.balance || 0).toFixed(2)}.` : ''} - ${settings.storeName}`;

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

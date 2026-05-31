// WhatsApp integration service for Expenso Mobile Repair Tracker

export interface WhatsAppMessage {
  to: string;
  type: "text" | "template" | "media";
  content: string;
  templateName?: string;
  templateParams?: string[];
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video";
}

export interface TransactionWhatsAppData {
  customerName: string;
  phoneNumber: string;
  deviceModel: string;
  repairType: string;
  repairCost: number;
  status: string;
  estimatedCompletion?: string;
  transactionId: string;
}

class WhatsAppService {
  private static instance: WhatsAppService;
  private apiUrl = "https://api.whatsapp.com/send"; // For web.whatsapp.com
  private businessApiUrl = ""; // Would be set for WhatsApp Business API

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  // Format phone number for WhatsApp
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned;
    } else if (cleaned.startsWith("0")) {
      cleaned = "91" + cleaned.substring(1);
    }

    return cleaned;
  }

  // Generate transaction confirmation message
  public generateTransactionMessage(data: TransactionWhatsAppData): string {
    const {
      customerName,
      deviceModel,
      repairType,
      repairCost,
      status,
      estimatedCompletion,
      transactionId,
    } = data;

    let message = `🔧 *Expenso Mobile Repair Tracker*\n\n`;
    message += `Dear ${customerName},\n\n`;
    message += `Your repair request has been received!\n\n`;
    message += `📱 *Device:* ${deviceModel}\n`;
    message += `🔧 *Repair Type:* ${repairType}\n`;
    message += `💰 *Cost:* ₹${repairCost.toLocaleString()}\n`;
    message += `📋 *Status:* ${status.charAt(0).toUpperCase() + status.slice(1)}\n`;
    message += `🆔 *Transaction ID:* ${transactionId}\n\n`;

    if (estimatedCompletion) {
      message += `⏰ *Estimated Completion:* ${estimatedCompletion}\n\n`;
    }

    message += `We'll keep you updated on the progress of your repair.\n\n`;
    message += `For any queries, please contact us or visit our shop.\n\n`;
    message += `Thank you for choosing Expenso! 🙏`;

    return message;
  }

  // Generate status update message
  public generateStatusUpdateMessage(data: TransactionWhatsAppData): string {
    const { customerName, deviceModel, status, transactionId } = data;

    let message = `🔧 *Expenso Mobile Repair Update*\n\n`;
    message += `Dear ${customerName},\n\n`;

    switch (status) {
      case "in-progress":
        message += `✅ Good news! Your ${deviceModel} repair is now in progress.\n\n`;
        message += `Our technician is working on your device and we'll notify you once it's ready.\n\n`;
        break;
      case "completed":
        message += `🎉 Great news! Your ${deviceModel} repair is completed!\n\n`;
        message += `Your device is ready for pickup. Please visit our shop at your convenience.\n\n`;
        message += `💰 Total Amount: ₹${data.repairCost.toLocaleString()}\n\n`;
        break;
      case "delivered":
        message += `📦 Your ${deviceModel} has been delivered successfully!\n\n`;
        message += `Thank you for choosing Expenso. We hope you're satisfied with our service.\n\n`;
        message += `Please rate your experience and refer us to your friends! ⭐\n\n`;
        break;
      default:
        message += `📋 Status update for your ${deviceModel} repair.\n\n`;
        message += `Current Status: ${status.charAt(0).toUpperCase() + status.slice(1)}\n\n`;
    }

    message += `🆔 Transaction ID: ${transactionId}\n\n`;
    message += `For any questions, feel free to contact us.\n\n`;
    message += `Best regards,\nExpenso Team 🔧`;

    return message;
  }

  // Generate payment reminder message
  public generatePaymentReminderMessage(data: TransactionWhatsAppData): string {
    const { customerName, deviceModel, repairCost, transactionId } = data;

    let message = `💰 *Payment Reminder - Expenso*\n\n`;
    message += `Dear ${customerName},\n\n`;
    message += `This is a friendly reminder about the pending payment for your ${deviceModel} repair.\n\n`;
    message += `💰 *Amount Due:* ₹${repairCost.toLocaleString()}\n`;
    message += `🆔 *Transaction ID:* ${transactionId}\n\n`;
    message += `Please visit our shop or contact us to complete the payment.\n\n`;
    message += `We accept:\n`;
    message += `💵 Cash\n`;
    message += `📱 UPI\n`;
    message += `💳 Card\n`;
    message += `🏦 Bank Transfer\n\n`;
    message += `Thank you for your cooperation! 🙏`;

    return message;
  }

  // Send WhatsApp message via web interface
  public async sendMessageViaWeb(
    phoneNumber: string,
    message: string,
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `${this.apiUrl}?phone=${formattedPhone}&text=${encodedMessage}`;

      // Open WhatsApp in new tab/window
      window.open(whatsappUrl, "_blank");

      return {
        success: true,
        url: whatsappUrl,
      };
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Send transaction confirmation
  public async sendTransactionConfirmation(
    data: TransactionWhatsAppData,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const message = this.generateTransactionMessage(data);
    const result = await this.sendMessageViaWeb(data.phoneNumber, message);

    if (result.success) {
      return {
        success: true,
        message: "WhatsApp opened successfully. Please send the message.",
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  // Send status update
  public async sendStatusUpdate(
    data: TransactionWhatsAppData,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const message = this.generateStatusUpdateMessage(data);
    const result = await this.sendMessageViaWeb(data.phoneNumber, message);

    if (result.success) {
      return {
        success: true,
        message: "Status update WhatsApp opened successfully.",
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  // Send payment reminder
  public async sendPaymentReminder(
    data: TransactionWhatsAppData,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const message = this.generatePaymentReminderMessage(data);
    const result = await this.sendMessageViaWeb(data.phoneNumber, message);

    if (result.success) {
      return {
        success: true,
        message: "Payment reminder WhatsApp opened successfully.",
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  // Validate phone number format
  public isValidPhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  // Get formatted display number
  public getDisplayNumber(phone: string): string {
    const formatted = this.formatPhoneNumber(phone);
    if (formatted.startsWith("91") && formatted.length === 12) {
      return `+91 ${formatted.substring(2, 7)} ${formatted.substring(7)}`;
    }
    return `+${formatted}`;
  }

  // Generate quick reply templates
  public getQuickReplyTemplates(): Array<{
    name: string;
    message: string;
    description: string;
  }> {
    return [
      {
        name: "Repair Ready",
        description: "Notify customer that repair is completed",
        message:
          "🎉 Good news! Your device repair is completed and ready for pickup. Please visit our shop at your convenience. Thank you for choosing Expenso! 🔧",
      },
      {
        name: "Delay Notification",
        description: "Inform about delay in repair",
        message:
          "⏰ We apologize for the delay in your device repair. Due to parts availability, we need an additional day. We'll have it ready by tomorrow. Sorry for the inconvenience! 🙏",
      },
      {
        name: "Payment Reminder",
        description: "Remind customer about pending payment",
        message:
          "💰 Friendly reminder: Your device repair is ready and payment is pending. Please visit our shop to complete payment and collect your device. Thank you! 🔧",
      },
      {
        name: "Quality Check",
        description: "Follow up on repair quality",
        message:
          "⭐ Hi! How's your repaired device working? We hope you're satisfied with our service. Please share your feedback and rate us. Thank you for choosing Expenso! 🙏",
      },
      {
        name: "Warranty Info",
        description: "Provide warranty information",
        message:
          "🛡️ Your device repair comes with a warranty. If you face any issues related to the repair within the warranty period, please contact us immediately. We're here to help! 🔧",
      },
    ];
  }
}

// Singleton instance
const whatsappService = WhatsAppService.getInstance();

// Public API functions
export function sendTransactionWhatsApp(
  data: TransactionWhatsAppData,
): Promise<{ success: boolean; message?: string; error?: string }> {
  return whatsappService.sendTransactionConfirmation(data);
}

export function sendStatusUpdateWhatsApp(
  data: TransactionWhatsAppData,
): Promise<{ success: boolean; message?: string; error?: string }> {
  return whatsappService.sendStatusUpdate(data);
}

export function sendPaymentReminderWhatsApp(
  data: TransactionWhatsAppData,
): Promise<{ success: boolean; message?: string; error?: string }> {
  return whatsappService.sendPaymentReminder(data);
}

export function validatePhoneNumber(phone: string): boolean {
  return whatsappService.isValidPhoneNumber(phone);
}

export function formatPhoneDisplay(phone: string): string {
  return whatsappService.getDisplayNumber(phone);
}

export function getWhatsAppQuickReplies(): Array<{
  name: string;
  message: string;
  description: string;
}> {
  return whatsappService.getQuickReplyTemplates();
}

// React hook for WhatsApp functionality
export function useWhatsApp() {
  return {
    sendTransaction: sendTransactionWhatsApp,
    sendStatusUpdate: sendStatusUpdateWhatsApp,
    sendPaymentReminder: sendPaymentReminderWhatsApp,
    validatePhone: validatePhoneNumber,
    formatPhone: formatPhoneDisplay,
    getQuickReplies: getWhatsAppQuickReplies,
  };
}

export default whatsappService;

import { toast } from "@/hooks/use-toast";

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
  title?: string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData) {
  try {
    const csvContent = [
      data.headers.join(","),
      ...data.rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell,
          )
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${data.filename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Successful",
      description: `Data exported to ${data.filename}.csv`,
    });
  } catch (error) {
    toast({
      title: "Export Failed",
      description: "Failed to export data. Please try again.",
      variant: "destructive",
    });
  }
}

/**
 * Generate PDF report (simulated - would integrate with jsPDF in real app)
 */
export function exportToPDF(data: ExportData) {
  // In a real application, you would use jsPDF or similar library
  toast({
    title: "PDF Generation Started",
    description: `Generating ${data.filename}.pdf...`,
  });

  // Simulate PDF generation
  setTimeout(() => {
    toast({
      title: "PDF Ready",
      description: `${data.filename}.pdf has been generated successfully.`,
    });
  }, 2000);
}

/**
 * Export bill as PDF (for E-Bill functionality)
 */
export function exportBillToPDF(bill: any) {
  // In a real application, this would generate a professional invoice PDF
  toast({
    title: "Bill PDF Generated",
    description: `Invoice ${bill.billNumber} is ready for download.`,
  });

  // Simulate PDF download
  setTimeout(() => {
    const link = document.createElement("a");
    link.href = "#"; // Would be actual PDF blob URL
    link.download = `Invoice-${bill.billNumber}.pdf`;
    // link.click(); // Commented out for demo
  }, 1000);
}

/**
 * Send SMS notification (simulated - would integrate with SMS service)
 */
export function sendSMSNotification(phoneNumber: string, message: string) {
  // In a real application, this would integrate with services like Twilio
  toast({
    title: "SMS Sent",
    description: `Message sent to ${phoneNumber}`,
  });

  console.log("SMS would be sent:", { phoneNumber, message });
}

/**
 * Send email notification (simulated - would integrate with email service)
 */
export function sendEmailNotification(
  email: string,
  subject: string,
  content: string,
) {
  // In a real application, this would integrate with email services
  toast({
    title: "Email Sent",
    description: `Email sent to ${email}`,
  });

  console.log("Email would be sent:", { email, subject, content });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a high-resolution PDF Blob from a DOM element
 */
export async function generateDprPdfBlob(element) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#020617',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output('blob');
}

/**
 * Triggers browser download of the PDF file
 */
export async function downloadDprPdf(element, filename) {
  try {
    const blob = await generateDprPdfBlob(element);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Failed to generate PDF. Please try browser print (Ctrl+P) instead.');
  }
}

/**
 * Shares formatted WhatsApp text and PDF via Web Share API or triggers download + WhatsApp Web
 */
export async function shareDprWhatsAppAndPdf(element, text, filename) {
  try {
    const blob = await generateDprPdfBlob(element);
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'ConstructTrack - Daily Progress Report',
        text: text,
        files: [file],
      });
      return { success: true, method: 'WEB_SHARE_API' };
    }

    downloadDprPdf(element, filename);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    return { success: true, method: 'DOWNLOAD_AND_WHATSAPP_WEB' };
  } catch (err) {
    console.error('Error in WhatsApp PDF sharing:', err);
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    return { success: false, method: 'WHATSAPP_TEXT_ONLY' };
  }
}

/**
 * Service Integration untuk WhatsApp Gateway
 * Mendukung pengiriman notifikasi otomatis ke Wali Santri.
 * Bisa disambungkan dengan Fonnte, Watsap.id, atau provider lain.
 */

interface WaPayload {
  target: string; // Nomor WA tujuan (misal: "08123456789")
  message: string;
}

export async function sendWhatsAppMessage({ target, message }: WaPayload) {
  // TODO: Implementasikan dengan API Key provider yang dipilih Yayasan.
  // Contoh menggunakan Fonnte:
  /*
  const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
  
  if (!FONNTE_TOKEN) {
    console.warn("FONNTE_TOKEN is not set. WhatsApp message not sent.");
    return false;
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN,
      },
      body: new URLSearchParams({
        target,
        message,
        countryCode: "62", // Default Indonesia
      }),
    });

    const data = await res.json();
    return data.status === true;
  } catch (error) {
    console.error("Failed to send WA message:", error);
    return false;
  }
  */

  // Mock implementation for development
  console.log(`[MOCK WA TO: ${target}]\n${message}\n------------------------`);
  
  // Simulasi delay jaringan
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return true; // Asumsikan berhasil
}

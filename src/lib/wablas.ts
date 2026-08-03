export async function sendWhatsAppMessage(phone: string, message: string) {
  const domain = process.env.WABLAS_DOMAIN;
  const token = process.env.WABLAS_TOKEN;

  if (!domain || !token) {
    console.error("WABLAS_DOMAIN or WABLAS_TOKEN is not set in environment variables");
    return false;
  }

  // Bersihkan nomor telepon (ganti awalan 0 menjadi 62, hapus spasi/simbol)
  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.substring(1);
  }

  try {
    const response = await fetch(`${domain}/api/send-message`, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: message,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      console.error("Wablas error:", data);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return false;
  }
}

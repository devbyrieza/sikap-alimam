/**
 * Service Integration untuk WhatsApp Gateway menggunakan Wablas API
 * Diadaptasi dari project alandalus-alimam
 */

export interface WablasResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface WaPayload {
  target: string; // Nomor WA tujuan (misal: "08123456789")
  message: string;
}

// Configuration
const WABLAS_DOMAIN = process.env.WABLAS_DOMAIN || "";
const WABLAS_TOKEN = process.env.WABLAS_TOKEN || "";
const WABLAS_SECRET_KEY = process.env.WABLAS_SECRET_KEY || "";

/**
 * Format phone number to international format
 * Input: 081234567890 or +6281234567890
 * Output: 6281234567890
 */
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Send a simple text message via Wablas
 */
export async function sendWhatsAppMessage({
  target,
  message,
}: WaPayload): Promise<WablasResponse> {
  if (!WABLAS_DOMAIN || !WABLAS_TOKEN) {
    console.warn("⚠️ Wablas credentials not configured in .env");
    // Fallback mock for development if credentials are not set
    console.log(`[MOCK WA TO: ${target}]\n${message}\n------------------------`);
    return { status: true, message: "Mock message sent (Wablas not configured)" };
  }

  try {
    const formattedPhone = formatPhoneNumber(target);

    // Ensure domain has protocol
    const domain = WABLAS_DOMAIN.startsWith("http")
      ? WABLAS_DOMAIN
      : `https://${WABLAS_DOMAIN}`;

    // Wablas API - POST with Authorization header: token.secret_key
    const url = `${domain}/api/send-message`;

    // Build Authorization header with token and secret key
    const authToken = WABLAS_SECRET_KEY
      ? `${WABLAS_TOKEN}.${WABLAS_SECRET_KEY}`
      : WABLAS_TOKEN;

    const formData = new URLSearchParams();
    formData.append("phone", formattedPhone);
    formData.append("message", message);

    console.log(`📡 Sending Wablas to ${formattedPhone}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("❌ Wablas Non-JSON Response:", rawText);
      return {
        status: false,
        message: `Wablas Error: ${response.status} ${response.statusText}`,
      };
    }

    if (!response.ok || !data.status) {
      console.error("❌ Wablas API Error:", data);
      return {
        status: false,
        message: data.message || `Wablas Failed: ${response.status}`,
      };
    }

    return { status: true, message: "Message sent successfully", data };
  } catch (error: any) {
    console.error("❌ Wablas Network Error:", error);
    return { status: false, message: `Network Error: ${error.message}` };
  }
}

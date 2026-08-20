/**
 * Standarisasi Validasi Format Username & Password
 * Sesuai Aturan Arsitektur Al-Andalus / Al-Imam (.agents/AGENTS.md)
 */

export function validateUsernameFormat(username: string): { isValid: boolean; error?: string } {
  if (!username) return { isValid: true };

  const clean = username.trim().toLowerCase();

  if (clean.length < 4 || clean.length > 30) {
    return { isValid: false, error: "Username harus berjumlah 4 hingga 30 karakter" };
  }

  if (!/^[a-z0-9._]+$/.test(clean)) {
    return { isValid: false, error: "Username hanya boleh huruf kecil (a-z), angka (0-9), titik (.), atau underscore (_)" };
  }

  return { isValid: true };
}

export function validateNewPasswordFormat(password: string): { isValid: boolean; error?: string } {
  if (!password) return { isValid: false, error: "Kata sandi baru wajib diisi" };

  if (password === "2026#@") {
    return { isValid: false, error: "Kata sandi baru tidak boleh menggunakan kata sandi default (2026#@)" };
  }

  if (password.length < 6) {
    return { isValid: false, error: "Kata sandi baru minimal 6 karakter" };
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: "Kata sandi baru disarankan mengombinasikan huruf dan angka/simbol" };
  }

  return { isValid: true };
}

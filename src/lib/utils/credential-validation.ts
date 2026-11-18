/**
 * Standarisasi Validasi Format Username & Password
 * Sesuai Aturan Arsitektur Al-Andalus / Al-Imam (.agents/AGENTS.md)
 */
import {
  validateUsernameFormat as validateStandardUsername,
  generateProfessionalUsername,
  normalizeUsernameInput,
} from "./username";

export { generateProfessionalUsername, normalizeUsernameInput };

export function validateUsernameFormat(username: string): { isValid: boolean; error?: string; normalized?: string } {
  return validateStandardUsername(username);
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

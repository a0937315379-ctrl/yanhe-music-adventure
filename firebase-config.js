// 請填入「原本音樂情緒 LIVE」的 Firebase 網頁設定 (不是私人金鑰)。
// 在 Firebase 控制台：專案設定 → 你的應用程式 → SDK設定與配置。
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  databaseURL: "PASTE_DATABASE_URL",
  projectId: "PASTE_PROJECT_ID",
  appId: "PASTE_APP_ID"
};
export const ROOM = "YANHE01";
export const TEACHER_UID = "YF43N5th6rdB1eifbGbrHU58yKp2";
export const isConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith("PASTE_"));

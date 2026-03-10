export function isAdmin(email?: string | null) {
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  return email ? admins.includes(email.toLowerCase()) : false;
}

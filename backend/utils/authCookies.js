const SESSION_DURATION_SECONDS = 60 * 60;

const readCookie = (req, name) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? cookie.slice(name.length + 1) : null;
};

const hasAllowedOrigin = (req) => {
  if (!req.headers.origin) return true;

  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''));
  return allowedOrigins.includes(req.headers.origin);
};

const setSessionCookie = (res, name, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append(
    'Set-Cookie',
    `${name}=${token}; HttpOnly; Path=/api; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure}`
  );
};

const clearSessionCookie = (res, name) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.append('Set-Cookie', `${name}=; HttpOnly; Path=/api; SameSite=Strict; Max-Age=0${secure}`);
};

module.exports = {
  SESSION_DURATION_SECONDS,
  readCookie,
  hasAllowedOrigin,
  setSessionCookie,
  clearSessionCookie,
};

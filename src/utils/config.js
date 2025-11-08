export const config = {
  adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@example.com',
  withdrawalCodeExpiry: 15 * 60 * 1000, // 15 minutes in milliseconds
  minPasswordLength: 8,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  errorMessages: {
    invalidEmail: 'Please enter a valid email address',
    weakPassword: 'Password must be at least 8 characters and include numbers and letters',
    emailInUse: 'An account already exists with this email. Try logging in.',
    loginFailed: 'Incorrect email or password',
    verificationNeeded: 'Please complete the human verification',
    serverError: 'An error occurred. Please try again later.',
    adminOnly: 'This action requires admin privileges'
  }
};

export const validatePassword = (password) => {
  const hasNumber = /[0-9]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  return password.length >= config.minPasswordLength && hasNumber && hasLetter;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const sanitizeUserData = (userData) => {
  const { password, ...safeData } = userData;
  return {
    ...safeData,
    password: '******'
  };
};
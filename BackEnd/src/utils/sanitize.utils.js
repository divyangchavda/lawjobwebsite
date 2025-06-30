// Sanitize user data before sending to frontend
export const sanitizeUser = (user) => {
  if (!user) return null;

  // Remove sensitive fields
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.__v;
  delete sanitized.passwordChangedAt;
  delete sanitized.passwordResetToken;
  delete sanitized.passwordResetExpires;

  // Convert MongoDB _id to string id
  if (sanitized._id) {
    sanitized.id = sanitized._id.toString();
    delete sanitized._id;
  }

  // Normalize userType to lowercase
  if (sanitized.userType) {
    sanitized.userType = sanitized.userType.toLowerCase();
  }

  // Remove file paths prefixes for security
  const fileFields = ['idProofFront', 'idProofBack', 'lawDegree', 'studentId', 'resume'];
  fileFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = sanitized[field].split('/').pop();
    }
  });

  return sanitized;
}; 
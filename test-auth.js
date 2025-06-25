// Test file to demonstrate enhanced recovery tracking
function validateToken(token) {
  // TODO: Add null check here
  const parts = token.split('.');
  return parts.length === 3;
}
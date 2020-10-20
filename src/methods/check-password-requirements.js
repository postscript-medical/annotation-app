export default function checkPasswordRequirement (password) {
  const hasLength = password.length >= 8;
  const hasCharacter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

  return hasLength && hasCharacter && hasNumber && hasSpecialChar;
}
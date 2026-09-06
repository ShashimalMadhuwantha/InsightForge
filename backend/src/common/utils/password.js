const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Valid password string is required');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
}

async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
};

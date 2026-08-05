const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const validate = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const router = express.Router();

const usersFile = process.env.USERS_FILE;

const loadUsers = () => {
  try {
    if (fs.existsSync(usersFile)) return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch (e) { /* محیط فقط خواندنی */ }
  return [];
};
const saveUsers = (users) => {
  try {
    if (!fs.existsSync(usersFile)) {
      fs.mkdirSync(path.dirname(usersFile), { recursive: true });
    }
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (e) { /* محیط فقط خواندنی */ }
};

let users = loadUsers();

const hashPassword = async (password) => {
  return bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
};

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(128).required()
});
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});
const hashSchema = Joi.object({ text: Joi.string().required() });

const generateToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) throw new AppError('Username already exists', 409);
    const hashed = await hashPassword(password);
    const user = { id: users.length + 1, username, password: hashed };
    users.push(user);
    saveUsers(users);
    const token = generateToken({ id: user.id, username });
    res.status(201).json({ success: true, module: 'security', action: 'register', data: { token } });
  } catch (err) { next(err); }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError('Invalid credentials', 401);
    const token = generateToken({ id: user.id, username });
    res.json({ success: true, module: 'security', action: 'login', data: { token } });
  } catch (err) { next(err); }
});

router.post('/hash', validate(hashSchema), (req, res) => {
  const hash = crypto.createHash('sha256').update(req.body.text).digest('hex');
  res.json({ success: true, module: 'security', action: 'hash', data: { algorithm: 'sha256', hash } });
});

module.exports = router;
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const { Pool } = pg;
const rl = createInterface({ input: stdin, output: stdout });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const username = (await rl.question('Username: ')).trim();
  const email = (await rl.question('Email: ')).trim().toLowerCase();
  const name = (await rl.question('Full name: ')).trim();
  const role = (await rl.question('Role (manager/mechanic): ')).trim();
  const password = await rl.question('Password (min 12 characters): ');
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) throw new Error('Username must be 3-40 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email.');
  if (!name || name.length > 120) throw new Error('Full name is required (max 120).');
  if (!['manager', 'mechanic'].includes(role)) throw new Error('Role must be manager or mechanic.');
  if (password.length < 12 || password.length > 200) throw new Error('Password must be 12-200 characters.');
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO auth_users (username, email, password_hash, role, full_name) VALUES ($1,$2,$3,$4,$5)',
    [username, email, hash, role, name],
  );
  console.log('Account created. Keep the password private.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
  rl.close();
}

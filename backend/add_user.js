require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command-line arguments
const argv = yargs(hideBin(process.argv))
  .option('username', {
    alias: 'u',
    type: 'string',
    demandOption: true,
    describe: 'Username for the new user'
  })
  .option('password', {
    alias: 'p',
    type: 'string',
    demandOption: true,
    describe: 'Password for the new user'
  })
  .help()
  .argv;

async function addUser() {
  const username = argv.username;
  const password = argv.password;

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const userId = randomUUID();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });

  try {
    // Insert user
    const [result] = await connection.execute(
      'INSERT INTO users (id, username, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
      [userId, username, hashedPassword]
    );

    console.log('✅ User added successfully!');
    console.log('User ID:', userId);
    console.log('Username:', username);
    console.log('Password hash created and stored');

  } catch (error) {
    console.error('❌ Error adding user:', error.message);
  } finally {
    await connection.end();
  }
}

addUser();

// node add_user.js --username=janek --password=haslo123
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { CreateHandler } from './commands/create_command';
import { GetHandler } from './queries/get_query';

const app = express();
const port = 3001;

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'reminder_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

app.use(cors());
app.use(express.json());

const createHandler = new CreateHandler();
const getHandler = new GetHandler();

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Połączenie z bazą danych MySQL udane');
    connection.release();
  } catch (error) {
    console.error('❌ Błąd połączenia z bazą danych:', error);
    throw error;
  }
}

app.post('/parse', async (req, res) => {
  try {
    const result = await createHandler.execute({ text: req.body.text });
    res.json(result);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Błąd serwera podczas tworzenia przypomnienia' });
  }
});

app.get('/reminders', async (req, res) => {
  try {
    const result = await getHandler.execute({});
    res.json(result);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania przypomnień' });
  }
});

app.listen(port, async () => {
  try {
    await testConnection();
    console.log(`🚀 Serwer uruchomiony na porcie ${port}`);
    console.log(`📝 Endpoint tworzenia: POST http://localhost:${port}/parse`);
    console.log(`📋 Endpoint pobierania: GET http://localhost:${port}/reminders`);
  } catch (error) {
    console.error('❌ Nie udało się uruchomić serwera:', error);
    process.exit(1);
  }
}); 






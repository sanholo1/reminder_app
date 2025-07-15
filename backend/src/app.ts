import express from 'express';

const app = express();

const PORT = 3000;

app.get('/sygnal', (_req, res) => {
  res.send('odbior');
});

app.listen(PORT, () => {
  console.log(`Serwer dziala poprawnie`);
});
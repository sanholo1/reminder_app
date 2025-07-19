import express from 'express';

const app = express();
const port = 3001;

app.use(express.json());



//endp used to parse message, its not working like i would like to but it is what it is
//its only working for really simple messages with 1. activity 2. day(jutro) 3. hour only like 00:00 
app.post('/parse', (req, res) => {

  const { text } = req.body;
  let action = text;
  let datetime: string | null = null;

  if (typeof text === 'string') {
    
    const tomorrowMatch = text.match(/jutro/i);
    
    const hourMatch = text.match(/(\d{1,2}):(\d{2})/);

    if (hourMatch) {

      let date: Date | null = null;

      if (tomorrowMatch) {

        const now = new Date();

        date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      }
      
      if (date) {

        const [_, h, m] = hourMatch;
        date.setHours(Number(h), Number(m), 0, 0);
        datetime = date.toLocaleString('pl-PL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Europe/Warsaw'
        });

      }
      
      action = text.split(hourMatch[0])[0]

        .replace(/jutro/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    } else {
      
      action = text.replace(/jutro/i, '').replace(/\s{2,}/g, ' ').trim();

    }
  }

  res.json({ action, datetime });

});



app.listen(port, () => {

  console.log(`Server listening on http://localhost:${port}`);

}); 

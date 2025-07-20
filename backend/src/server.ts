import express from 'express';
import cors from 'cors';
import { CreateHandler } from './commands/create_command';
import { GetHandler } from './queries/get_query';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const createHandler = new CreateHandler();
const getHandler = new GetHandler();

app.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await createHandler.execute({ text });
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      activity: result.activity,
      datetime: result.datetime
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/reminders', async (req, res) => {
  try {
    const query = {
      status: req.query.status as string
    };

    const reminders = await getHandler.execute(query);

    res.json(reminders);

  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 






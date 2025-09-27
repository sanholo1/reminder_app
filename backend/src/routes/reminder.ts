import { Router } from 'express';
import { getRepository } from 'typeorm';
import { Reminder } from '../entity/Reminder';

const router = Router();
const reminderRepository = getRepository(Reminder);

// Przykład pobierania przypomnień tylko dla danego użytkownika
router.get('/', async (req, res) => {
  const userId = req.user.id; // zakładam, że masz middleware autoryzacji
  const reminders = await reminderRepository.find({ where: { userId } });
  res.json(reminders);
});

router.post('/', async (req, res) => {
  const userId = req.user.id;
  const reminder = reminderRepository.create({ ...req.body, userId });
  await reminderRepository.save(reminder);
  res.json(reminder);
});

export default router;
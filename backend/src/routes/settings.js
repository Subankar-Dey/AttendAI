import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import Settings from '../models/Settings.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole('admin'), async (req, res) => {
  const settings = await Settings.find();
  res.json({ status: 'success', data: { settings } });
});

router.put('/:key', requireRole('admin'), async (req, res) => {
  const { value } = req.body;
  const setting = await Settings.findOneAndUpdate(
    { key: req.params.key },
    { key: req.params.key, value, updatedBy: req.user._id },
    { upsert: true, new: true }
  );
  res.json({ status: 'success', data: { setting } });
});

export default router;
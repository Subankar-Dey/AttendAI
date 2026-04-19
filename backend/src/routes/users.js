import express from 'express';
import { getAllProfiles, getAllUsers, getUserById, createUser, updateUser, deleteUser, getStudents, getStaff } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);

router.get('/profiles', requireRole('admin'), getAllProfiles);
router.get('/', requireRole('admin', 'staff'), getAllUsers);
router.get('/students', getStudents);
router.get('/staff', getStaff);
router.get('/:id', getUserById);
router.post('/', requireRole('admin'), createUser);
router.put('/:id', updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
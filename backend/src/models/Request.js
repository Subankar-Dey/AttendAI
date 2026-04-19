import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'STUDENT_CREATE',
      'ATTENDANCE_CORRECTION',
      'ROLE_CHANGE'
    ],
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  adminNote: String
}, { timestamps: true });

export default mongoose.model('Request', requestSchema);

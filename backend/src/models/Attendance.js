import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: [true, 'Status is required']
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by is required']
  },
  checkIn: Date,
  checkOut: Date,
  source: {
    type: String,
    enum: ['manual', 'biometric', 'RFID'],
    default: 'manual'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

attendanceSchema.index({ student: 1, date: 1, class: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ class: 1 });
attendanceSchema.index({ markedBy: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
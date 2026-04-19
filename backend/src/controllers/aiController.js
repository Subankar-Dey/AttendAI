import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import catchAsync from '../utils/catchAsync.js';
import { getOpenAI } from '../utils/openai.js';

export const predict = catchAsync(async (req, res, next) => {
  const { studentId } = req.body;

  const student = await User.findById(studentId);
  if (!student) return res.status(404).json({ status: 'error', message: 'Student not found.' });

  const records = await Attendance.find({ student: studentId }).sort({ date: -1 }).limit(30);
  const recentAbsences = records.filter(r => r.status === 'absent').length;

  let risk = 'low';
  if (recentAbsences >= 5) risk = 'high';
  else if (recentAbsences >= 3) risk = 'medium';

  const prediction = {
    student: student._id,
    risk,
    recentAbsences,
    suggestion: risk === 'high' ? 'Immediate attention required.' : 'Monitor attendance.'
  };

  res.json({ status: 'success', data: { prediction } });
});

export const analyze = catchAsync(async (req, res, next) => {
  const { classId, startDate, endDate } = req.query;

  const query = { class: classId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const records = await Attendance.find(query);

  const dailyAbsence = {};
  records.forEach(r => {
    const dateKey = r.date.toISOString().split('T')[0];
    if (!dailyAbsence[dateKey]) dailyAbsence[dateKey] = 0;
    if (r.status === 'absent') dailyAbsence[dateKey]++;
  });

  const anomalyDates = Object.entries(dailyAbsence)
    .filter(([_, count]) => count > 10)
    .map(([date, count]) => ({ date, count, alert: 'Unusual absence pattern' }));

  res.json({ status: 'success', data: { anomalies: anomalyDates } });
});

export const chatbot = catchAsync(async (req, res, next) => {
  const { message, role } = req.body;
  const user = req.user;

  // Restrict actions based on role
  let allowedOps = [];
  if (role === 'admin') allowedOps = ['view_all', 'approve', 'manage'];
  else if (role === 'staff') allowedOps = ['request', 'review', 'mark_attendance'];
  else allowedOps = ['view_own', 'request_correction'];

  // Inject org and user context
  const orgContext = `Organization: AttendAI\nUser: ${user?.name || ''} (${role})\nAllowed operations: ${allowedOps.join(', ')}\n`;
  const prompt = `${orgContext}\nUser message: ${message}\n\nRespond ONLY with actions and suggestions allowed for this user role. If the user asks for something not permitted, politely explain the restriction.`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an attendance management assistant. Always respect organization rules and user permissions.' },
        { role: 'user', content: prompt }
      ]
    });
    const response = completion.choices[0].message.content;
    res.json({ status: 'success', data: { response } });
  } catch (error) {
    // Fallback response for invalid/test API keys
    if (error.message.includes('401') || error.message.includes('invalid') || error.message.includes('unauthorized')) {
      const fallbackResponse = `I'm in test mode (invalid API key). In production, I would say: "${message.substring(0, 50)}..." - For a real response, please configure a valid OPENAI_API_KEY in backend/.env`;
      return res.json({ status: 'success', data: { response: fallbackResponse, note: 'Using fallback - set valid OPENAI_API_KEY to enable real AI' } });
    }
    throw error;
  }
});

export const ocr = catchAsync(async (req, res, next) => {
  const { imageUrl } = req.body;

  res.json({
    status: 'success',
    data: {
      timetable: [],
      message: 'OCR processing placeholder. Provide image URL to extract timetable data.'
    }
  });
});

export const insights = catchAsync(async (req, res, next) => {
  const atRiskStudents = await Attendance.aggregate([
    { $match: { status: 'absent' } },
    { $group: { _id: '$student', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  res.json({ status: 'success', data: { atRiskStudents } });
});
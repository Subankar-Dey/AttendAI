import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import catchAsync from '../utils/catchAsync.js';
import { getOpenAI } from '../utils/openai.js';

// ─────────────────────────────────────────────
//  Smart Local AI Engine
//  Reads real DB data and answers common queries
//  without any OpenAI API call.
// ─────────────────────────────────────────────
const localAI = {

  /** Detect intent from user message */
  detectIntent(msg) {
    const m = msg.toLowerCase();
    if (/absent|absentee|missing|not (present|attend)/i.test(m)) return 'absentees';
    if (/at.?risk|low attend|below 75|defaulter|danger/i.test(m)) return 'at_risk';
    if (/report|summary|overview|statistic|stat/i.test(m)) return 'report';
    if (/present|who came|attendance today/i.test(m)) return 'present_today';
    if (/how many student|total student|count/i.test(m)) return 'student_count';
    if (/hello|hi|hey|help|what can/i.test(m)) return 'greeting';
    if (/who am i|my role|my name/i.test(m)) return 'identity';
    if (/late|tardy/i.test(m)) return 'late_students';
    if (/trend|week|month|pattern/i.test(m)) return 'trend';
    return 'unknown';
  },

  /** Build a real response from DB */
  async buildResponse(intent, user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    switch (intent) {

      case 'greeting': {
        const tips = [
          "Try asking: **'Show today's absentees'**",
          "Try asking: **'Which students are at risk?'**",
          "Try asking: **'Give me a class report'**",
          "Try asking: **'How many students are present today?'**",
        ];
        return `👋 Hi ${user.name}! I'm your AttendAI assistant.\n\nI can help you with:\n• 📋 Today's absentees\n• ⚠️ At-risk students (below 75%)\n• 📊 Attendance reports & trends\n• 🕐 Late arrivals\n• 👥 Student counts\n\n${tips[Math.floor(Math.random() * tips.length)]}`;
      }

      case 'identity': {
        return `You are **${user.name}**, logged in as **${user.role}** in the AttendAI system.`;
      }

      case 'absentees': {
        const absentRecords = await Attendance.find({
          date: { $gte: today, $lt: tomorrow },
          status: 'absent'
        }).populate('student', 'name rollNumber').populate('class', 'name');

        if (absentRecords.length === 0) {
          return `✅ Great news! No absences recorded for today (${today.toDateString()}) yet.\n\nThis could mean attendance hasn't been marked yet, or everyone is present!`;
        }

        const list = absentRecords.map(r =>
          `• **${r.student?.name || 'Unknown'}** (${r.student?.rollNumber || 'N/A'}) — ${r.class?.name || 'Unknown class'}`
        ).join('\n');

        return `📋 **Absentees for ${today.toDateString()}** (${absentRecords.length} student${absentRecords.length > 1 ? 's' : ''}):\n\n${list}`;
      }

      case 'present_today': {
        const presentCount = await Attendance.countDocuments({
          date: { $gte: today, $lt: tomorrow },
          status: 'present'
        });
        const absentCount = await Attendance.countDocuments({
          date: { $gte: today, $lt: tomorrow },
          status: 'absent'
        });
        const lateCount = await Attendance.countDocuments({
          date: { $gte: today, $lt: tomorrow },
          status: 'late'
        });
        const total = presentCount + absentCount + lateCount;
        const pct = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;

        return `📊 **Today's Attendance (${today.toDateString()})**\n\n✅ Present: **${presentCount}**\n❌ Absent: **${absentCount}**\n🕐 Late: **${lateCount}**\n📈 Attendance Rate: **${pct}%**${total === 0 ? '\n\n⚠️ Attendance has not been marked yet today.' : ''}`;
      }

      case 'at_risk': {
        const students = await User.find({ role: 'student', isActive: true });
        const atRisk = [];

        for (const student of students) {
          const total = await Attendance.countDocuments({ student: student._id });
          if (total === 0) continue;
          const present = await Attendance.countDocuments({ student: student._id, status: 'present' });
          const late = await Attendance.countDocuments({ student: student._id, status: 'late' });
          const pct = ((present + late * 0.5) / total) * 100;
          if (pct < 75) {
            atRisk.push({ name: student.name, rollNumber: student.rollNumber, pct: pct.toFixed(1) });
          }
        }

        if (atRisk.length === 0) {
          return `✅ All students currently have attendance **above 75%**. No at-risk students found.`;
        }

        atRisk.sort((a, b) => parseFloat(a.pct) - parseFloat(b.pct));
        const list = atRisk.map(s =>
          `• **${s.name}** (${s.rollNumber || 'N/A'}) — ${s.pct}% ⚠️`
        ).join('\n');

        return `⚠️ **At-Risk Students — Below 75% Attendance** (${atRisk.length} found)\n\n${list}\n\n💡 Consider sending warnings to these students and notifying their parents.`;
      }

      case 'late_students': {
        const lateRecords = await Attendance.find({
          date: { $gte: today, $lt: tomorrow },
          status: 'late'
        }).populate('student', 'name rollNumber');

        if (lateRecords.length === 0) {
          return `🕐 No late arrivals recorded for today (${today.toDateString()}).`;
        }
        const list = lateRecords.map(r => `• **${r.student?.name}** (${r.student?.rollNumber || 'N/A'})`).join('\n');
        return `🕐 **Late Arrivals Today** (${lateRecords.length}):\n\n${list}`;
      }

      case 'student_count': {
        const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
        const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
        const classes = await Class.countDocuments({});
        return `👥 **System Overview**\n\n🎓 Total Students: **${totalStudents}**\n👨‍🏫 Total Staff: **${totalStaff}**\n🏫 Total Classes: **${classes}**`;
      }

      case 'report': {
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const total = await Attendance.countDocuments({ date: { $gte: sevenDaysAgo } });
        const present = await Attendance.countDocuments({ date: { $gte: sevenDaysAgo }, status: 'present' });
        const absent = await Attendance.countDocuments({ date: { $gte: sevenDaysAgo }, status: 'absent' });
        const late = await Attendance.countDocuments({ date: { $gte: sevenDaysAgo }, status: 'late' });
        const pct = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

        return `📊 **7-Day Attendance Report**\n\n📅 Period: Last 7 days\n📝 Total Records: **${total}**\n✅ Present: **${present}** (${pct}%)\n❌ Absent: **${absent}**\n🕐 Late: **${late}**\n\n${parseFloat(pct) >= 80 ? '🟢 Overall attendance is healthy.' : parseFloat(pct) >= 65 ? '🟡 Attendance needs monitoring.' : '🔴 Attendance is critically low — action required!'}`;
      }

      case 'trend': {
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const records = await Attendance.find({ date: { $gte: thirtyDaysAgo } });
        const byWeek = {};
        records.forEach(r => {
          const week = Math.floor((Date.now() - r.date.getTime()) / (7 * 24 * 3600 * 1000));
          const label = week === 0 ? 'This week' : week === 1 ? 'Last week' : `${week} weeks ago`;
          if (!byWeek[label]) byWeek[label] = { total: 0, present: 0 };
          byWeek[label].total++;
          if (r.status === 'present') byWeek[label].present++;
        });
        const lines = Object.entries(byWeek).map(([week, d]) => {
          const pct = d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : 0;
          const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
          return `• ${week}: ${bar} ${pct}%`;
        }).join('\n');
        return `📈 **30-Day Attendance Trend**\n\n${lines || 'No data available for the past 30 days.'}`;
      }

      default:
        return null; // let OpenAI handle unknown queries
    }
  }
};

// ─────────────────────────────────────────────
//  Main chatbot endpoint
// ─────────────────────────────────────────────
export const chatbot = catchAsync(async (req, res, next) => {
  const { message, role } = req.body;
  const user = req.user;

  if (!message?.trim()) {
    return res.status(400).json({ status: 'error', message: 'Message is required.' });
  }

  // 1️⃣ Try local AI engine first (instant, no quota needed)
  const intent = localAI.detectIntent(message);
  const localResponse = await localAI.buildResponse(intent, user);

  if (localResponse) {
    return res.json({
      status: 'success',
      data: { response: localResponse, source: 'local', intent }
    });
  }

  // 2️⃣ Fall back to OpenAI for complex/unknown queries
  let allowedOps = [];
  if (role === 'admin') allowedOps = ['view_all', 'approve', 'manage_users', 'manage_departments'];
  else if (role === 'staff') allowedOps = ['mark_attendance', 'view_class', 'view_absentees', 'generate_report'];
  else allowedOps = ['view_own_attendance', 'request_correction'];

  const systemPrompt = `You are AttendAI, an intelligent school attendance management assistant.
User: ${user?.name} | Role: ${role} | Allowed: ${allowedOps.join(', ')}
Be concise (max 4 sentences). Use bullet points. Emoji where helpful.
If asked for something the user's role doesn't allow, politely decline and explain.`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 250,
      temperature: 0.5,
    });
    const response = completion.choices[0].message.content;
    return res.json({ status: 'success', data: { response, source: 'openai', intent } });

  } catch (error) {
    // Quota / auth error → smart generic fallback
    const isQuotaError = error.status === 429 || error.message?.includes('quota') || error.message?.includes('insufficient');
    const isAuthError = error.status === 401 || error.message?.includes('401') || error.message?.includes('invalid');

    if (isQuotaError || isAuthError) {
      const fallback = `🤖 I couldn't find a specific answer in the database for: "*${message.trim()}*"\n\nTry one of these instead:\n• **Show today's absentees**\n• **Which students are at risk?**\n• **Give me a 7-day report**\n• **How many students do we have?**\n• **Show attendance trend**`;
      return res.json({
        status: 'success',
        data: { response: fallback, source: 'fallback', intent, note: isQuotaError ? 'OpenAI quota exceeded' : 'OpenAI key invalid' }
      });
    }
    throw error;
  }
});

// ─────────────────────────────────────────────
//  Other endpoints (unchanged)
// ─────────────────────────────────────────────
export const predict = catchAsync(async (req, res, next) => {
  const { studentId } = req.body;
  const student = await User.findById(studentId);
  if (!student) return res.status(404).json({ status: 'error', message: 'Student not found.' });

  const records = await Attendance.find({ student: studentId }).sort({ date: -1 }).limit(30);
  const recentAbsences = records.filter(r => r.status === 'absent').length;

  let risk = 'low';
  if (recentAbsences >= 5) risk = 'high';
  else if (recentAbsences >= 3) risk = 'medium';

  res.json({ status: 'success', data: { prediction: {
    student: student._id,
    risk, recentAbsences,
    suggestion: risk === 'high' ? 'Immediate counselling required.' : risk === 'medium' ? 'Monitor closely and send warning.' : 'Attendance is healthy.'
  }}});
});

export const analyze = catchAsync(async (req, res, next) => {
  const { classId, startDate, endDate } = req.query;
  const query = {};
  if (classId) query.class = classId;
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
    .filter(([_, count]) => count > 3)
    .map(([date, count]) => ({ date, count, alert: count > 10 ? 'Critical absence spike' : 'Unusual absence pattern' }));

  res.json({ status: 'success', data: { anomalies: anomalyDates } });
});

export const ocr = catchAsync(async (req, res, next) => {
  res.json({ status: 'success', data: { timetable: [], message: 'OCR processing placeholder.' } });
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
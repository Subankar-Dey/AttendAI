import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import catchAsync from '../utils/catchAsync.js';
import { getOpenAI } from '../utils/openai.js';
import fetch from 'node-fetch';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'qwen2.5-coder:7b';

// ─────────────────────────────────────────────────────────────
//  DATA LOADERS  (real DB queries per role)
// ─────────────────────────────────────────────────────────────

async function loadStudentData(userId) {
  const student = await User.findById(userId).select('name email rollNumber');
  const records = await Attendance.find({ student: userId }).sort({ date: -1 }).limit(60);

  const total   = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent  = records.filter(r => r.status === 'absent').length;
  const late    = records.filter(r => r.status === 'late').length;
  const pct     = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(1) : 0;

  // Last 5 absences
  const recentAbsences = records.filter(r => r.status === 'absent').slice(0, 5)
    .map(r => r.date.toISOString().split('T')[0]);

  // How many more classes they can miss
  const required = 0.75;
  const safeToMiss = Math.max(0, Math.floor(((present + late * 0.5) - required * total) / required));

  // Today's record
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const todayRecord = records.find(r => r.date >= today && r.date < tomorrow);

  return {
    student,
    stats: { total, present, absent, late, pct, safeToMiss },
    recentAbsences,
    todayStatus: todayRecord?.status || 'not marked yet'
  };
}

async function loadStaffData(userId) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
  const presentToday  = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'present' });
  const absentToday   = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'absent' });
  const lateToday     = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'late' });

  // At-risk students (simple count)
  const students = await User.find({ role: 'student', isActive: true }).select('_id name');
  let atRiskCount = 0;
  const atRiskList = [];
  for (const s of students.slice(0, 20)) {
    const t = await Attendance.countDocuments({ student: s._id });
    const p = await Attendance.countDocuments({ student: s._id, status: 'present' });
    const l = await Attendance.countDocuments({ student: s._id, status: 'late' });
    if (t > 0 && ((p + l * 0.5) / t) < 0.75) {
      atRiskCount++;
      atRiskList.push(`${s.name} (${((p + l * 0.5) / t * 100).toFixed(0)}%)`);
    }
  }

  // 7-day summary
  const weekTotal   = await Attendance.countDocuments({ date: { $gte: sevenDaysAgo } });
  const weekPresent = await Attendance.countDocuments({ date: { $gte: sevenDaysAgo }, status: 'present' });
  const weekPct     = weekTotal > 0 ? ((weekPresent / weekTotal) * 100).toFixed(1) : 0;

  return {
    today: { present: presentToday, absent: absentToday, late: lateToday, total: totalStudents },
    week: { total: weekTotal, present: weekPresent, pct: weekPct },
    atRisk: { count: atRiskCount, list: atRiskList.slice(0, 5) }
  };
}

async function loadAdminData() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
  const totalStaff    = await User.countDocuments({ role: 'staff', isActive: true });
  const totalClasses  = await Class.countDocuments({});
  const presentToday  = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'present' });
  const absentToday   = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'absent' });

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthTotal    = await Attendance.countDocuments({ date: { $gte: thirtyDaysAgo } });
  const monthPresent  = await Attendance.countDocuments({ date: { $gte: thirtyDaysAgo }, status: 'present' });
  const monthPct      = monthTotal > 0 ? ((monthPresent / monthTotal) * 100).toFixed(1) : 0;

  return {
    system: { totalStudents, totalStaff, totalClasses },
    today: { present: presentToday, absent: absentToday },
    month: { pct: monthPct, total: monthTotal }
  };
}

// ─────────────────────────────────────────────────────────────
//  PROMPT BUILDER  (role-specific with injected real data)
// ─────────────────────────────────────────────────────────────

function buildPrompt(role, message, user, data) {
  const today = new Date().toDateString();

  if (role === 'student') {
    const { stats, recentAbsences, todayStatus } = data;
    return `You are AttendAI, a friendly personal attendance assistant for students.

STUDENT PROFILE:
- Name: ${user.name}
- Roll No: ${user.rollNumber || 'N/A'}
- Today (${today}): ${todayStatus}

ATTENDANCE STATISTICS:
- Total classes recorded: ${stats.total}
- Present: ${stats.present} | Absent: ${stats.absent} | Late: ${stats.late}
- Current attendance %: ${stats.pct}%
- Status: ${parseFloat(stats.pct) >= 75 ? '✅ Safe (above 75%)' : '⚠️ At Risk (below 75%)'}
- Classes can still miss (safe): ${stats.safeToMiss}
- Recent absences on: ${recentAbsences.join(', ') || 'None'}

INSTRUCTIONS:
- Answer ONLY based on the data above. Do NOT make up values.
- Be warm, encouraging and concise (3-4 sentences max).
- Use emojis naturally. Format clearly.
- If attendance is low, motivate the student to improve.
- If asked something you don't have data for, say so politely.

Student question: ${message}

Answer:`;
  }

  if (role === 'staff') {
    const { today: t, week, atRisk } = data;
    const pctToday = t.total > 0 ? ((t.present / t.total) * 100).toFixed(1) : 0;
    return `You are AttendAI, an intelligent class attendance assistant for teaching staff.

TODAY'S SNAPSHOT (${today}):
- Total students: ${t.total}
- Present: ${t.present} | Absent: ${t.absent} | Late: ${t.late}
- Today's attendance rate: ${pctToday}%

7-DAY SUMMARY:
- Total records: ${week.total}
- Attendance rate: ${week.pct}%

AT-RISK STUDENTS (below 75%):
- Count: ${atRisk.count}
- Names: ${atRisk.list.length > 0 ? atRisk.list.join(', ') : 'None'}

INSTRUCTIONS:
- Answer based on the data above. Be professional and concise.
- Use bullet points and emojis for clarity.
- Suggest actionable steps when relevant (e.g., send warnings, contact parents).
- Max 5 lines.

Staff question: ${message}

Answer:`;
  }

  // admin
  const { system, today: t, month } = data;
  const pctToday = (t.present + t.absent) > 0 ? ((t.present / (t.present + t.absent)) * 100).toFixed(1) : 0;
  return `You are AttendAI, an advanced analytics assistant for school administrators.

SYSTEM OVERVIEW (${today}):
- Total students: ${system.totalStudents}
- Total staff: ${system.totalStaff}
- Total classes: ${system.totalClasses}

TODAY'S ATTENDANCE:
- Present: ${t.present} | Absent: ${t.absent}
- Rate: ${pctToday}%

30-DAY PERFORMANCE:
- Overall attendance rate: ${month.pct}%
- Total records: ${month.total}

INSTRUCTIONS:
- Provide insightful administrative analysis.
- Use structured formatting with headers and bullets.
- Suggest policy actions when appropriate.
- Be concise but comprehensive. Max 6 lines.

Admin question: ${message}

Answer:`;
}

// ─────────────────────────────────────────────────────────────
//  OLLAMA  (local LLM fallback — no quota issues)
// ─────────────────────────────────────────────────────────────

async function callOllama(prompt) {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.4, num_predict: 300 }
      }),
      signal: AbortSignal.timeout(25000)  // 25s timeout
    });
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const json = await response.json();
    return json.response?.trim() || null;
  } catch (err) {
    console.warn('[Ollama] Failed:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
//  LOCAL INTENT ENGINE  (instant DB responses)
// ─────────────────────────────────────────────────────────────

const localAI = {
  detectIntent(msg) {
    const m = msg.toLowerCase();
    if (/absent|absentee|missing|not (present|attend)/i.test(m)) return 'absentees';
    if (/at.?risk|low attend|below 75|defaulter|danger/i.test(m)) return 'at_risk';
    if (/report|summary|overview|statistic|stat/i.test(m)) return 'report';
    if (/present|who came|attendance today/i.test(m)) return 'present_today';
    if (/how many student|total student|count/i.test(m)) return 'student_count';
    if (/hello|hi |hey|help|what can/i.test(m)) return 'greeting';
    if (/who am i|my role|my name/i.test(m)) return 'identity';
    if (/late|tardy/i.test(m)) return 'late_students';
    if (/trend|week|month|pattern/i.test(m)) return 'trend';
    // Student-specific intents
    if (/my attend|my %|my percent|my record/i.test(m)) return 'my_attendance';
    if (/miss|can i (skip|miss)|how many.*miss|safe to miss/i.test(m)) return 'safe_to_miss';
    if (/today.*status|am i present|did i come/i.test(m)) return 'today_status';
    if (/predict|forecast|trend|semester/i.test(m)) return 'prediction';
    return 'unknown';
  },

  async buildStudentResponse(intent, user, data) {
    const { stats, recentAbsences, todayStatus } = data;
    switch (intent) {
      case 'greeting':
        return `👋 Hi **${user.name}**! I'm your personal attendance assistant.\n\nYour current attendance is **${stats.pct}%** ${parseFloat(stats.pct) >= 75 ? '✅ (Safe)' : '⚠️ (Below 75%)'}\n\nYou can ask me:\n• 📊 My attendance percentage\n• 🔢 How many classes I can miss\n• 📅 Today's status\n• 📈 My attendance trend`;
      case 'my_attendance':
        return `📊 **Your Attendance Summary**\n\n✅ Present: **${stats.present}** classes\n❌ Absent: **${stats.absent}** classes\n🕐 Late: **${stats.late}** classes\n📈 Overall: **${stats.pct}%** ${parseFloat(stats.pct) >= 75 ? '✅ You are safe!' : '⚠️ Below 75% — needs improvement'}\n${recentAbsences.length > 0 ? `\n📅 Recent absences: ${recentAbsences.join(', ')}` : ''}`;
      case 'safe_to_miss':
        return stats.safeToMiss > 0
          ? `🔢 **Classes You Can Still Miss**\n\nYou can safely miss **${stats.safeToMiss} more class${stats.safeToMiss > 1 ? 'es' : ''}** and still stay above 75%.\n\n📈 Current: **${stats.pct}%** | Target: **75%**\n\n💡 Tip: Try to attend all upcoming classes to improve your percentage!`
          : `⚠️ **You cannot miss any more classes!**\n\nYour attendance is **${stats.pct}%** — already at or below 75%.\n\n📉 Skipping any more classes will put you at risk of being debarred from exams.\n\n💪 Please attend all classes going forward!`;
      case 'today_status':
        return `📅 **Today's Status** (${new Date().toDateString()})\n\n${todayStatus === 'present' ? '✅ You are **Present** today!' : todayStatus === 'absent' ? '❌ You are marked **Absent** today.' : todayStatus === 'late' ? '🕐 You were marked **Late** today.' : '⏳ Attendance has **not been marked yet** for today.'}\n\n📊 Overall attendance: **${stats.pct}%**`;
      case 'prediction':
        const trend = parseFloat(stats.pct) >= 85 ? '📈 Excellent' : parseFloat(stats.pct) >= 75 ? '📊 Stable' : '📉 Declining';
        return `📈 **Attendance Trend Prediction**\n\n${trend} — Your current rate is **${stats.pct}%**\n\n• Present: ${stats.present} / ${stats.total} classes\n• If trend continues: You'll ${parseFloat(stats.pct) >= 75 ? 'likely stay safe ✅' : 'remain at risk ⚠️'}\n\n${parseFloat(stats.pct) < 75 ? '💡 Attend the next **' + Math.ceil(stats.total * 0.75 - stats.present) + ' consecutive classes** to reach 75%.' : '🌟 Keep it up! You\'re doing great.'}`;
      case 'identity':
        return `👤 You are **${user.name}** (${user.email})\n🆔 Roll No: **${user.rollNumber || 'N/A'}**\n🎓 Role: **Student**\n📊 Attendance: **${stats.pct}%**`;
      default:
        return null;
    }
  },

  async buildStaffResponse(intent, user, data) {
    const { today: t, week, atRisk } = data;
    const pct = t.total > 0 ? ((t.present / t.total) * 100).toFixed(1) : 0;
    switch (intent) {
      case 'greeting':
        return `👋 Hi **${user.name}**! I'm your class management assistant.\n\n📊 Today: **${t.present}/${t.total}** present (**${pct}%**)\n⚠️ At-risk students: **${atRisk.count}**\n\nAsk me about absentees, at-risk students, reports, or trends!`;
      case 'absentees':
      case 'present_today':
        return `📊 **Today's Attendance** (${new Date().toDateString()})\n\n✅ Present: **${t.present}**\n❌ Absent: **${t.absent}**\n🕐 Late: **${t.late}**\n👥 Total: **${t.total}**\n📈 Rate: **${pct}%**\n\n${t.absent > 0 ? `💡 ${t.absent} student${t.absent > 1 ? 's' : ''} absent today. Consider sending absence notifications.` : '✅ Great attendance today!'}`;
      case 'at_risk':
        return atRisk.count > 0
          ? `⚠️ **At-Risk Students** (below 75%)\n\nCount: **${atRisk.count}** student${atRisk.count > 1 ? 's' : ''}\n\n${atRisk.list.map(s => `• ${s}`).join('\n')}\n\n💡 Recommend sending attendance warnings and notifying parents.`
          : `✅ **All students are above 75%!** No at-risk students currently.`;
      case 'report':
        return `📊 **7-Day Attendance Report**\n\n📅 Period: Last 7 days\n📝 Records: **${week.total}**\n📈 Attendance Rate: **${week.pct}%**\n\n${parseFloat(week.pct) >= 80 ? '🟢 Healthy attendance' : parseFloat(week.pct) >= 65 ? '🟡 Needs monitoring' : '🔴 Critical — action required'}\n\n💡 View detailed reports in the Reports section.`;
      case 'identity':
        return `👤 **${user.name}** (${user.email})\n👨‍🏫 Role: **Staff / Teacher**\n📊 Today: **${t.present}/${t.total}** present`;
      default:
        return null;
    }
  },

  async buildAdminResponse(intent, user, data) {
    const { system, today: t, month } = data;
    const pct = (t.present + t.absent) > 0 ? ((t.present / (t.present + t.absent)) * 100).toFixed(1) : 0;
    switch (intent) {
      case 'greeting':
        return `👋 Hello **${user.name}**! I'm your system analytics assistant.\n\n🏫 **${system.totalStudents}** students | **${system.totalStaff}** staff | **${system.totalClasses}** classes\n📊 Today: **${pct}%** attendance | 30-day avg: **${month.pct}%**\n\nAsk me about system stats, attendance reports, or trends!`;
      case 'student_count':
        return `👥 **System Overview**\n\n🎓 Students: **${system.totalStudents}**\n👨‍🏫 Staff: **${system.totalStaff}**\n🏫 Classes: **${system.totalClasses}**\n📊 30-day attendance: **${month.pct}%**\n📝 Total records (30 days): **${system.totalStudents > 0 ? month.total : 0}**`;
      case 'present_today':
      case 'absentees':
        return `📊 **Today's System-Wide Attendance** (${new Date().toDateString()})\n\n✅ Present: **${t.present}**\n❌ Absent: **${t.absent}**\n📈 Rate: **${pct}%**\n\n📅 30-day performance: **${month.pct}%** average\n${parseFloat(pct) < 70 ? '🔴 Below target — consider sending alerts to staff.' : '🟢 Attendance is on track.'}`;
      case 'report':
      case 'trend':
        return `📈 **30-Day System Report**\n\n📊 Overall Rate: **${month.pct}%**\n📝 Total Records: **${month.total}**\n🎓 Students: **${system.totalStudents}** | 🏫 Classes: **${system.totalClasses}**\n\n${parseFloat(month.pct) >= 80 ? '🟢 System performing well' : parseFloat(month.pct) >= 65 ? '🟡 Moderate — review required' : '🔴 Critical — immediate action needed'}\n\n💡 Use Reports section for detailed breakdowns.`;
      case 'identity':
        return `👤 **${user.name}** (${user.email})\n🔑 Role: **Administrator**\n🏫 Managing: **${system.totalStudents}** students, **${system.totalStaff}** staff`;
      default:
        return null;
    }
  }
};

// ─────────────────────────────────────────────────────────────
//  MAIN CHATBOT ENDPOINT
// ─────────────────────────────────────────────────────────────

export const chatbot = catchAsync(async (req, res, next) => {
  const { message, role } = req.body;
  const user = req.user;

  if (!message?.trim()) {
    return res.status(400).json({ status: 'error', message: 'Message is required.' });
  }

  // 1️⃣ Load role-specific real data from DB
  let dbData = {};
  try {
    if (role === 'student') dbData = await loadStudentData(user._id);
    else if (role === 'staff') dbData = await loadStaffData(user._id);
    else dbData = await loadAdminData();
  } catch (err) {
    console.error('[AI] DB load failed:', err.message);
  }

  // 2️⃣ Try local intent engine (instant, no API)
  const intent = localAI.detectIntent(message);
  let localResponse = null;
  try {
    if (role === 'student')     localResponse = await localAI.buildStudentResponse(intent, user, dbData);
    else if (role === 'staff')  localResponse = await localAI.buildStaffResponse(intent, user, dbData);
    else                        localResponse = await localAI.buildAdminResponse(intent, user, dbData);
  } catch (err) {
    console.error('[AI] Local engine error:', err.message);
  }

  if (localResponse) {
    return res.json({ status: 'success', data: { response: localResponse, source: 'local', intent } });
  }

  // 3️⃣ Try Ollama (local LLM — free, no quota)
  const prompt = buildPrompt(role, message, user, dbData);
  const ollamaResponse = await callOllama(prompt);
  if (ollamaResponse) {
    return res.json({ status: 'success', data: { response: ollamaResponse, source: 'ollama', intent } });
  }

  // 4️⃣ Try OpenAI (if quota available)
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.4,
    });
    const response = completion.choices[0].message.content;
    return res.json({ status: 'success', data: { response, source: 'openai', intent } });
  } catch { /* fall through */ }

  // 5️⃣ Smart role-based final fallback
  const fallbackMap = {
    student: `🤖 I couldn't find a direct answer to "*${message}*" in your records.\n\nTry asking:\n• **My attendance percentage**\n• **How many classes can I miss?**\n• **Today's status**\n• **My attendance trend**`,
    staff:   `🤖 I couldn't process "*${message}*" automatically.\n\nTry asking:\n• **Show today's absentees**\n• **At-risk students**\n• **7-day attendance report**\n• **Who was late today?**`,
    admin:   `🤖 I couldn't process "*${message}*" automatically.\n\nTry asking:\n• **System overview**\n• **Today's attendance rate**\n• **30-day performance report**\n• **How many students do we have?**`,
  };
  return res.json({
    status: 'success',
    data: { response: fallbackMap[role] || fallbackMap.admin, source: 'fallback', intent }
  });
});

// ─────────────────────────────────────────────────────────────
//  OTHER ENDPOINTS (unchanged)
// ─────────────────────────────────────────────────────────────

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
    student: student._id, risk, recentAbsences,
    suggestion: risk === 'high' ? 'Immediate counselling required.' : risk === 'medium' ? 'Monitor closely.' : 'Attendance healthy.'
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
    const k = r.date.toISOString().split('T')[0];
    if (!dailyAbsence[k]) dailyAbsence[k] = 0;
    if (r.status === 'absent') dailyAbsence[k]++;
  });
  const anomalyDates = Object.entries(dailyAbsence)
    .filter(([, count]) => count > 3)
    .map(([date, count]) => ({ date, count, alert: count > 10 ? 'Critical spike' : 'Unusual pattern' }));
  res.json({ status: 'success', data: { anomalies: anomalyDates } });
});

export const ocr = catchAsync(async (req, res, next) => {
  res.json({ status: 'success', data: { timetable: [], message: 'OCR placeholder.' } });
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
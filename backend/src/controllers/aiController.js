import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import LeaveRequest from '../models/LeaveRequest.js'; // Added
import Request from '../models/Request.js'; // Added
import catchAsync from '../utils/catchAsync.js';
import { getOpenAI } from '../utils/openai.js';
import fetch from 'node-fetch';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'qwen2.5-coder:7b';

// ─────────────────────────────────────────────────────────────
//  DATA LOADERS  (real DB queries per role)
// ─────────────────────────────────────────────────────────────

async function loadStudentData(userId) {
  const student = await User.findById(userId).select('name email rollNumber semester course');
  const records = await Attendance.find({ student: userId }).sort({ date: -1 }).limit(60);
  const leaves = await LeaveRequest.find({ student: userId, status: 'approved' });

  const total   = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent  = records.filter(r => r.status === 'absent').length;
  const late    = records.filter(r => r.status === 'late').length;
  const pct     = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(1) : 0;

  // Last 5 absences and check if they have approved leave for those dates
  const recentAbsences = records.filter(r => r.status === 'absent').slice(0, 5)
    .map(r => {
      const dateStr = r.date.toISOString().split('T')[0];
      const leave = leaves.find(l => r.date >= l.startDate && r.date <= l.endDate);
      return leave ? `${dateStr} (Approved Leave: ${leave.type})` : dateStr;
    });

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
    todayStatus: todayRecord?.status || 'not marked yet',
    approvedLeavesCount: leaves.length
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

  // Pending requests count for staff (if any)
  const pendingRequests = await Request.countDocuments({ status: 'pending' });

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
    atRisk: { count: atRiskCount, list: atRiskList.slice(0, 5) },
    pendingRequests
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
  
  const pendingRequests = await Request.countDocuments({ status: 'pending' });
  const pendingLeaves = await LeaveRequest.countDocuments({ status: 'pending' });

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthTotal    = await Attendance.countDocuments({ date: { $gte: thirtyDaysAgo } });
  const monthPresent  = await Attendance.countDocuments({ date: { $gte: thirtyDaysAgo }, status: 'present' });
  const monthPct      = monthTotal > 0 ? ((monthPresent / monthTotal) * 100).toFixed(1) : 0;

  return {
    system: { totalStudents, totalStaff, totalClasses },
    today: { present: presentToday, absent: absentToday },
    month: { pct: monthPct, total: monthTotal },
    pending: { requests: pendingRequests, leaves: pendingLeaves }
  };
}

// ─────────────────────────────────────────────────────────────
//  PROMPT BUILDER  (role-specific with injected real data)
// ─────────────────────────────────────────────────────────────

function buildPrompt(role, message, user, data) {
  const today = new Date().toDateString();

  if (role === 'student') {
    const { stats, recentAbsences, todayStatus, approvedLeavesCount } = data;
    return `You are AttendAI, a friendly personal attendance assistant for students.

STUDENT PROFILE:
- Name: ${user.name}
- Roll No: ${user.rollNumber || 'N/A'}
- Today (${today}): ${todayStatus}
- Approved Leaves: ${approvedLeavesCount}

ATTENDANCE STATISTICS:
- Total classes recorded: ${stats.total}
- Present: ${stats.present} | Absent: ${stats.absent} | Late: ${stats.late}
- Current attendance %: ${stats.pct}%
- Status: ${parseFloat(stats.pct) >= 75 ? '✅ Safe (above 75%)' : '⚠️ At Risk (below 75%)'}
- Classes can still miss (safe): ${stats.safeToMiss}
- Recent absences on: ${recentAbsences.join(', ') || 'None'} (Dates marked with approved leave are justified)

INSTRUCTIONS:
- Answer ONLY based on the data above. Do NOT make up values.
- If they ask "Why am I absent?", check the recent absences. If a date has "(Approved Leave...)", explain it.
- Be warm, encouraging and concise (3-4 sentences max).
- Use emojis naturally. Format clearly.
- If asked something you don't have data for, say so politely.

Student question: ${message}

Answer:`;
  }

  if (role === 'staff') {
    const { today: t, week, atRisk, pendingRequests } = data;
    const pctToday = t.total > 0 ? ((t.present / t.total) * 100).toFixed(1) : 0;
    return `You are AttendAI, an intelligent class attendance assistant for teaching staff.

TODAY'S SNAPSHOT (${today}):
- Total students: ${t.total}
- Present: ${t.present} | Absent: ${t.absent} | Late: ${t.late}
- Today's attendance rate: ${pctToday}%
- Pending Requests to process: ${pendingRequests}

7-DAY SUMMARY:
- Total records: ${week.total}
- Attendance rate: ${week.pct}%

AT-RISK STUDENTS (below 75%):
- Count: ${atRisk.count}
- Names: ${atRisk.list.length > 0 ? atRisk.list.join(', ') : 'None'}

INSTRUCTIONS:
- Answer based on the data above. Be professional and concise.
- Use bullet points and emojis for clarity.
- Max 5 lines.

Staff question: ${message}

Answer:`;
  }

  // admin
  const { system, today: t, month, pending } = data;
  const pctToday = (t.present + t.absent) > 0 ? ((t.present / (t.present + t.absent)) * 100).toFixed(1) : 0;
  return `You are AttendAI, an advanced analytics assistant for school administrators.

SYSTEM OVERVIEW (${today}):
- Total students: ${system.totalStudents}
- Total staff: ${system.totalStaff}
- Total classes: ${system.totalClasses}

TODAY'S ATTENDANCE:
- Present: ${t.present} | Absent: ${t.absent}
- Rate: ${pctToday}%

PENDING ACTIONS:
- Pending Correction Requests: ${pending.requests}
- Pending Leave Requests: ${pending.leaves}

30-DAY PERFORMANCE:
- Overall attendance rate: ${month.pct}%
- Total records: ${month.total}

INSTRUCTIONS:
- Provide insightful administrative analysis.
- Max 6 lines.

Admin question: ${message}

Answer:`;
}

// ─────────────────────────────────────────────────────────────
//  OLLAMA  (local LLM fallback)
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
      signal: AbortSignal.timeout(25000)
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
//  LOCAL INTENT ENGINE
// ─────────────────────────────────────────────────────────────

const localAI = {
  detectIntent(msg) {
    const m = msg.toLowerCase();
    if (/absent|absentee|missing|not (present|attend)|why.*absent/i.test(m)) return 'absentees';
    if (/at.?risk|low attend|below 75|defaulter|danger/i.test(m)) return 'at_risk';
    if (/report|summary|overview|statistic|stat/i.test(m)) return 'report';
    if (/present|who came|attendance today/i.test(m)) return 'present_today';
    if (/how many student|total student|count/i.test(m)) return 'student_count';
    if (/hello|hi |hey|help|what can/i.test(m)) return 'greeting';
    if (/who am i|my role|my name/i.test(m)) return 'identity';
    if (/late|tardy/i.test(m)) return 'late_students';
    if (/trend|week|month|pattern/i.test(m)) return 'trend';
    // Student-specific
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
        return `👋 Hi **${user.name}**! I'm your personal attendance assistant.\n\nYour current attendance is **${stats.pct}%** ${parseFloat(stats.pct) >= 75 ? '✅ (Safe)' : '⚠️ (Below 75%)'}\n\nYou can ask me:\n• 📊 My attendance percentage\n• 🔢 How many classes I can miss\n• ❓ Why am I absent recently?\n• 📈 My attendance trend`;
      case 'absentees': // "Why am I absent?"
        const absenceNotes = recentAbsences.filter(a => a.includes('Approved')).join('\n• ');
        const rawAbsences = recentAbsences.filter(a => !a.includes('Approved')).join(', ');
        return `📅 **Your Recent Absence Analysis**\n\n${absenceNotes ? `✅ **Justified Absences:**\n• ${absenceNotes}\n` : ''}${rawAbsences ? `❌ **Unjustified Absences:** ${rawAbsences}\n\n💡 Tip: If you were present on these dates, submit a **Correction Request** in the Requests section.` : '✅ You have no unjustified recent absences!'}`;
      case 'my_attendance':
        return `📊 **Your Attendance Summary**\n\n✅ Present: **${stats.present}** classes\n❌ Absent: **${stats.absent}** classes\n📈 Overall: **${stats.pct}%**\n\n${parseFloat(stats.pct) >= 75 ? '🌟 Great job, you are above the required 75%!' : '⚠️ Attention: Your attendance is below 75%. Please attend upcoming classes to avoid shortage.'}`;
      case 'safe_to_miss':
        return stats.safeToMiss > 0
          ? `🔢 **Classes You Can Still Miss**\n\nYou can safely miss **${stats.safeToMiss} more class${stats.safeToMiss > 1 ? 'es' : ''}** and still stay above 75%.\n\n📈 Current: **${stats.pct}%** | Target: **75%**`
          : `⚠️ **You cannot miss any more classes!**\n\nYour attendance is **${stats.pct}%**. Skipping any more classes will put you below the 75% threshold.`;
      case 'today_status':
        return `📅 **Today's Status**\n\n${todayStatus === 'present' ? '✅ You are marked **Present** today!' : todayStatus === 'absent' ? '❌ You are marked **Absent** today.' : '⏳ Attendance has **not been marked yet** for today.'}\n\n📊 Total attendance: **${stats.pct}%**`;
      case 'identity':
        return `👤 You are **${user.name}**\n🆔 Roll No: **${user.rollNumber || 'N/A'}**\n🎓 Course: **${user.course || 'N/A'}**\n📊 Attendance: **${stats.pct}%**`;
      default:
        return null;
    }
  },

  async buildStaffResponse(intent, user, data) {
    const { today: t, week, atRisk, pendingRequests } = data;
    const pct = t.total > 0 ? ((t.present / t.total) * 100).toFixed(1) : 0;
    switch (intent) {
      case 'greeting':
        return `👋 Hi **${user.name}**! I'm your class management assistant.\n\n📊 Today: **${t.present}/${t.total}** present (**${pct}%**)\n⚠️ At-risk students: **${atRisk.count}**\n📝 Pending requests: **${pendingRequests}**`;
      case 'report':
        return `📊 **7-Day Attendance Report**\n\n📝 Records: **${week.total}**\n📈 Attendance Rate: **${week.pct}%**\n\n${parseFloat(week.pct) >= 80 ? '🟢 Healthy attendance' : '🟡 Review required for low-attendance classes'}`;
      default:
        return null;
    }
  },

  async buildAdminResponse(intent, user, data) {
    const { system, today: t, month, pending } = data;
    const pct = (t.present + t.absent) > 0 ? ((t.present / (t.present + t.absent)) * 100).toFixed(1) : 0;
    switch (intent) {
      case 'greeting':
        return `👋 Hello **${user.name}**! I'm your system analytics assistant.\n\n🏫 **${system.totalStudents}** students | **${system.totalStaff}** staff\n📊 Today: **${pct}%** attendance\n📝 Pending: **${pending.requests}** corrections, **${pending.leaves}** leaves`;
      default:
        return null;
    }
  }
};

export const chatbot = catchAsync(async (req, res, next) => {
  const { message, role } = req.body;
  const user = req.user;

  if (!message?.trim()) {
    return res.status(400).json({ status: 'error', message: 'Message is required.' });
  }

  let dbData = {};
  try {
    if (role === 'student') dbData = await loadStudentData(user._id);
    else if (role === 'staff') dbData = await loadStaffData(user._id);
    else dbData = await loadAdminData();
  } catch (err) { console.error('[AI] DB load failed:', err.message); }

  const intent = localAI.detectIntent(message);
  let localResponse = null;
  try {
    if (role === 'student')     localResponse = await localAI.buildStudentResponse(intent, user, dbData);
    else if (role === 'staff')  localResponse = await localAI.buildStaffResponse(intent, user, dbData);
    else                        localResponse = await localAI.buildAdminResponse(intent, user, dbData);
  } catch (err) { console.error('[AI] Local engine error:', err.message); }

  if (localResponse) {
    return res.json({ status: 'success', data: { response: localResponse, source: 'local', intent } });
  }

  const prompt = buildPrompt(role, message, user, dbData);
  const ollamaResponse = await callOllama(prompt);
  if (ollamaResponse) {
    return res.json({ status: 'success', data: { response: ollamaResponse, source: 'ollama', intent } });
  }

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

  const fallbackMap = {
    student: `🤖 I couldn't find a direct answer to "*${message}*". Try asking about your % or why you were absent.`,
    staff:   `🤖 I couldn't process "*${message}*". Try asking for today's summary or at-risk students.`,
    admin:   `🤖 I couldn't process "*${message}*". Try asking for a system overview or pending requests.`,
  };
  return res.json({ status: 'success', data: { response: fallbackMap[role] || fallbackMap.admin, source: 'fallback', intent } });
});

export const predict = (req, res) => res.json({ status: 'success' });
export const analyze = (req, res) => res.json({ status: 'success' });
export const ocr = (req, res) => res.json({ status: 'success' });
export const insights = (req, res) => res.json({ status: 'success' });
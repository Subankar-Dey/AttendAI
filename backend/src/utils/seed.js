import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Create admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@attendai.com',
        password: 'admin123',
        role: 'admin',
        emailVerified: true
      });
      console.log('👤 Admin created: admin@attendai.com / admin123');
    }

    // Create departments
    let cseDept = await Department.findOne({ code: 'CSE' });
    if (!cseDept) {
      cseDept = await Department.create({ name: 'Computer Science', code: 'CSE', description: 'Computer Science and Engineering' });
    }
    let eceDept = await Department.findOne({ code: 'ECE' });
    if (!eceDept) {
      eceDept = await Department.create({ name: 'Electronics', code: 'ECE', description: 'Electronics and Communication Engineering' });
    }
    console.log('🏫 Departments ready');

    // Create classes
    let cseA = await Class.findOne({ name: 'CSE-A' });
    if (!cseA) {
      cseA = await Class.create({ name: 'CSE-A', department: cseDept._id, year: 2024, section: 'A' });
    }
    let cseB = await Class.findOne({ name: 'CSE-B' });
    if (!cseB) {
      cseB = await Class.create({ name: 'CSE-B', department: cseDept._id, year: 2024, section: 'B' });
    }
    console.log('📚 Classes ready');

    // Create subjects
    const subjectData = [
      { name: 'Data Structures', code: 'CS201', class: cseA._id },
      { name: 'Operating Systems', code: 'CS301', class: cseA._id },
      { name: 'Database Systems', code: 'CS302', class: cseB._id },
    ];
    for (const s of subjectData) {
      const exists = await Subject.findOne({ code: s.code });
      if (!exists) await Subject.create(s);
    }
    console.log('📖 Subjects ready');

    // Create staff
    const staffExists = await User.findOne({ email: 'staff@attendai.com' });
    let staff;
    if (!staffExists) {
      staff = await User.create({
        name: 'John Teacher',
        email: 'staff@attendai.com',
        password: 'staff123',
        role: 'staff',
        department: cseDept._id,
        emailVerified: true
      });
      console.log('👨‍🏫 Staff created: staff@attendai.com / staff123');
    } else {
      staff = staffExists;
    }

    // Assign class teacher
    if (!cseA.classTeacher) {
      cseA.classTeacher = staff._id;
      await cseA.save();
    }

    // Create students
    const students = [
      { name: 'Ravi Kumar', email: 'ravi@attendai.com', rollNumber: 'CSE001' },
      { name: 'Anita Sharma', email: 'anita@attendai.com', rollNumber: 'CSE002' },
      { name: 'Kiran Patel', email: 'kiran@attendai.com', rollNumber: 'CSE003' },
      { name: 'Priya Singh', email: 'priya@attendai.com', rollNumber: 'CSE004' },
      { name: 'Amit Das', email: 'amit@attendai.com', rollNumber: 'CSE005' },
    ];

    const createdStudents = [];
    for (const s of students) {
      let user = await User.findOne({ email: s.email });
      if (!user) {
        user = await User.create({
          ...s,
          password: 'student123',
          role: 'student',
          class: cseA._id,
          department: cseDept._id,
          emailVerified: true
        });
        console.log(`🎓 Student created: ${s.email}`);
      }
      createdStudents.push(user);
    }

    // Seed attendance data (last 30 days)
    const existingAttendance = await Attendance.countDocuments();
    if (existingAttendance === 0) {
      const statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
      const records = [];

      for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        date.setHours(0, 0, 0, 0);

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        for (const student of createdStudents) {
          records.push({
            student: student._id,
            class: cseA._id,
            date,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            markedBy: staff._id
          });
        }
      }

      await Attendance.insertMany(records);
      console.log(`📊 Seeded ${records.length} attendance records`);
    }

    console.log('\n✅ Seeding complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Default credentials:');
    console.log('  Admin:   admin@attendai.com / admin123');
    console.log('  Staff:   staff@attendai.com / staff123');
    console.log('  Student: ravi@attendai.com  / student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Logisys Smart Attendance System...');

  // Clean existing tables in proper cascade order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendanceCorrectionRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.facultyAssignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.section.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.academicTerm.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 1. System Settings
  console.log('⚙️ Seeding system settings...');
  await prisma.systemSetting.createMany({
    data: [
      { key: 'min_attendance_threshold', value: '75', description: 'Mandatory minimum attendance percentage' },
      { key: 'critical_attendance_threshold', value: '65', description: 'Critical shortage threshold for detention warning' },
      { key: 'institution_name', value: 'National Institute of Engineering & Technology (NIET)', description: 'College name displayed on reports and UI' },
      { key: 'institution_code', value: 'NIET-LOGISYS', description: 'Portal institution code' },
      { key: 'academic_term_name', value: 'Odd Semester 2026-27', description: 'Current active academic term' },
      { key: 'attendance_edit_window_hours', value: '72', description: 'Hours within which faculty can edit marked attendance' },
    ],
  });

  // 2. Departments
  console.log('🏢 Seeding departments...');
  const cseDept = await prisma.department.create({
    data: {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science & Engineering',
    },
  });

  const iseDept = await prisma.department.create({
    data: {
      code: 'ISE',
      name: 'Information Science & Engineering',
      description: 'Department of Information Science & Engineering',
    },
  });

  const eceDept = await prisma.department.create({
    data: {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      description: 'Department of Electronics & Communication Engineering',
    },
  });

  const aimlDept = await prisma.department.create({
    data: {
      code: 'AIML',
      name: 'Artificial Intelligence & Machine Learning',
      description: 'Department of AI & Machine Learning',
    },
  });

  // 3. Academic Term
  console.log('📅 Seeding academic term...');
  const currentTerm = await prisma.academicTerm.create({
    data: {
      name: 'Odd Semester 2026-27',
      academicYear: '2026-2027',
      semesterNumber: 5,
      isCurrent: true,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-20'),
    },
  });

  // 4. Sections
  console.log('🏫 Seeding sections...');
  const secCSE5A = await prisma.section.create({ data: { name: '5A', departmentId: cseDept.id, semester: 5 } });
  const secCSE5B = await prisma.section.create({ data: { name: '5B', departmentId: cseDept.id, semester: 5 } });
  const secISE5A = await prisma.section.create({ data: { name: '5A', departmentId: iseDept.id, semester: 5 } });
  const secECE5A = await prisma.section.create({ data: { name: '5A', departmentId: eceDept.id, semester: 5 } });
  const secAIML5A = await prisma.section.create({ data: { name: '5A', departmentId: aimlDept.id, semester: 5 } });

  // 5. Subjects
  console.log('📚 Seeding courses and subjects...');
  // CSE Subjects
  const subDSA = await prisma.subject.create({
    data: { code: 'CS501', name: 'Data Structures & Algorithms', departmentId: cseDept.id, semester: 5, credits: 4, totalSyllabusHours: 45, subjectType: 'THEORY' },
  });
  const subDBMS = await prisma.subject.create({
    data: { code: 'CS502', name: 'Database Management Systems', departmentId: cseDept.id, semester: 5, credits: 4, totalSyllabusHours: 45, subjectType: 'THEORY' },
  });
  const subCN = await prisma.subject.create({
    data: { code: 'CS503', name: 'Computer Networks', departmentId: cseDept.id, semester: 5, credits: 4, totalSyllabusHours: 40, subjectType: 'THEORY' },
  });
  const subOS = await prisma.subject.create({
    data: { code: 'CS504', name: 'Operating Systems & System Software', departmentId: cseDept.id, semester: 5, credits: 4, totalSyllabusHours: 40, subjectType: 'THEORY' },
  });
  const subWebLab = await prisma.subject.create({
    data: { code: 'CS505L', name: 'Web Technology & Database Lab', departmentId: cseDept.id, semester: 5, credits: 2, totalSyllabusHours: 30, subjectType: 'LAB' },
  });

  // ISE Subjects
  const subCloud = await prisma.subject.create({
    data: { code: 'IS501', name: 'Cloud Computing & Distributed Systems', departmentId: iseDept.id, semester: 5, credits: 4, totalSyllabusHours: 42, subjectType: 'THEORY' },
  });
  const subSec = await prisma.subject.create({
    data: { code: 'IS502', name: 'Information & Network Security', departmentId: iseDept.id, semester: 5, credits: 4, totalSyllabusHours: 42, subjectType: 'THEORY' },
  });
  const subSoftware = await prisma.subject.create({
    data: { code: 'IS503', name: 'Agile Software Engineering', departmentId: iseDept.id, semester: 5, credits: 3, totalSyllabusHours: 38, subjectType: 'THEORY' },
  });
  const subCloudLab = await prisma.subject.create({
    data: { code: 'IS504L', name: 'Cloud Architecture & DevOps Lab', departmentId: iseDept.id, semester: 5, credits: 2, totalSyllabusHours: 30, subjectType: 'LAB' },
  });

  // ECE Subjects
  const subDSP = await prisma.subject.create({
    data: { code: 'EC501', name: 'Digital Signal Processing', departmentId: eceDept.id, semester: 5, credits: 4, totalSyllabusHours: 45, subjectType: 'THEORY' },
  });
  const subEmbedded = await prisma.subject.create({
    data: { code: 'EC502', name: 'Microcontrollers & Embedded Systems', departmentId: eceDept.id, semester: 5, credits: 4, totalSyllabusHours: 42, subjectType: 'THEORY' },
  });
  const subVLSI = await prisma.subject.create({
    data: { code: 'EC503', name: 'VLSI Circuit Design', departmentId: eceDept.id, semester: 5, credits: 4, totalSyllabusHours: 40, subjectType: 'THEORY' },
  });

  // AIML Subjects
  const subML = await prisma.subject.create({
    data: { code: 'AI501', name: 'Machine Learning & Deep Neural Nets', departmentId: aimlDept.id, semester: 5, credits: 4, totalSyllabusHours: 45, subjectType: 'THEORY' },
  });
  const subNLP = await prisma.subject.create({
    data: { code: 'AI502', name: 'Natural Language Processing & LLMs', departmentId: aimlDept.id, semester: 5, credits: 4, totalSyllabusHours: 42, subjectType: 'THEORY' },
  });
  const subAILab = await prisma.subject.create({
    data: { code: 'AI503L', name: 'Deep Learning & PyTorch Lab', departmentId: aimlDept.id, semester: 5, credits: 2, totalSyllabusHours: 30, subjectType: 'LAB' },
  });

  const cseSubjects = [subDSA, subDBMS, subCN, subOS, subWebLab];
  const iseSubjects = [subCloud, subSec, subSoftware, subCloudLab];
  const eceSubjects = [subDSP, subEmbedded, subVLSI];
  const aimlSubjects = [subML, subNLP, subAILab];

  // Passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const facultyPasswordHash = await bcrypt.hash('Faculty@123', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);

  // 6. Users: Admin
  console.log('👤 Seeding administrators...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@logisys.edu',
      passwordHash: adminPasswordHash,
      name: 'Chief Academic Registrar (Admin)',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  // 7. Users: Faculty
  console.log('👨‍🏫 Seeding faculty across departments...');
  const facultyData = [
    { name: 'Dr. Rajesh Sharma', email: 'faculty.sharma@logisys.edu', empId: 'FAC-CSE-012', dept: cseDept.id, desig: 'Professor & HOD', qual: 'Ph.D. in Computer Science', contact: '+91 98450 11223' },
    { name: 'Prof. Anita Patel', email: 'faculty.patel@logisys.edu', empId: 'FAC-CSE-025', dept: cseDept.id, desig: 'Associate Professor', qual: 'M.Tech, Ph.D. Scholar', contact: '+91 98450 22334' },
    { name: 'Dr. Suresh Kumar', email: 'faculty.kumar@logisys.edu', empId: 'FAC-CSE-033', dept: cseDept.id, desig: 'Assistant Professor', qual: 'Ph.D. in Operating Systems', contact: '+91 98450 33445' },
    { name: 'Dr. Kavitha Raman', email: 'faculty.raman@logisys.edu', empId: 'FAC-ISE-019', dept: iseDept.id, desig: 'Professor & Head ISE', qual: 'Ph.D. in Cloud Networks', contact: '+91 98450 44556' },
    { name: 'Prof. Harish Gowda', email: 'faculty.gowda@logisys.edu', empId: 'FAC-ISE-028', dept: iseDept.id, desig: 'Associate Professor', qual: 'M.Tech Cyber Security', contact: '+91 98450 55667' },
    { name: 'Prof. Vikram Deshpande', email: 'faculty.deshpande@logisys.edu', empId: 'FAC-ECE-031', dept: eceDept.id, desig: 'Associate Professor', qual: 'M.Tech Embedded Systems', contact: '+91 98450 66778' },
    { name: 'Dr. Preeti Shenoy', email: 'faculty.shenoy@logisys.edu', empId: 'FAC-ECE-042', dept: eceDept.id, desig: 'Assistant Professor', qual: 'Ph.D. in VLSI Nanotechnology', contact: '+91 98450 77889' },
    { name: 'Dr. Sunita Murthy', email: 'faculty.murthy@logisys.edu', empId: 'FAC-AIML-003', dept: aimlDept.id, desig: 'Professor & Lead AI', qual: 'Ph.D. from IISc in Deep Learning', contact: '+91 98450 88990' },
  ];

  const facultyMap = {};
  for (const f of facultyData) {
    const user = await prisma.user.create({
      data: {
        email: f.email,
        passwordHash: facultyPasswordHash,
        name: f.name,
        role: 'FACULTY',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.name)}`,
        facultyProfile: {
          create: {
            employeeId: f.empId,
            departmentId: f.dept,
            designation: f.desig,
            qualification: f.qual,
            contactNo: f.contact,
          },
        },
      },
      include: { facultyProfile: true },
    });
    facultyMap[f.email] = user;
  }

  // 8. Faculty Assignments
  console.log('📌 Assigning faculty to subjects and sections...');
  const assignments = [
    // CSE 5A
    { facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, subjectId: subDBMS.id, sectionId: secCSE5A.id },
    { facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, subjectId: subDSA.id, sectionId: secCSE5A.id },
    { facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, subjectId: subCN.id, sectionId: secCSE5A.id },
    { facultyId: facultyMap['faculty.kumar@logisys.edu'].facultyProfile.id, subjectId: subOS.id, sectionId: secCSE5A.id },
    { facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, subjectId: subWebLab.id, sectionId: secCSE5A.id },

    // CSE 5B
    { facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, subjectId: subDSA.id, sectionId: secCSE5B.id },
    { facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, subjectId: subDBMS.id, sectionId: secCSE5B.id },
    { facultyId: facultyMap['faculty.kumar@logisys.edu'].facultyProfile.id, subjectId: subOS.id, sectionId: secCSE5B.id },

    // ISE 5A
    { facultyId: facultyMap['faculty.raman@logisys.edu'].facultyProfile.id, subjectId: subCloud.id, sectionId: secISE5A.id },
    { facultyId: facultyMap['faculty.gowda@logisys.edu'].facultyProfile.id, subjectId: subSec.id, sectionId: secISE5A.id },
    { facultyId: facultyMap['faculty.raman@logisys.edu'].facultyProfile.id, subjectId: subCloudLab.id, sectionId: secISE5A.id },

    // ECE 5A
    { facultyId: facultyMap['faculty.deshpande@logisys.edu'].facultyProfile.id, subjectId: subEmbedded.id, sectionId: secECE5A.id },
    { facultyId: facultyMap['faculty.shenoy@logisys.edu'].facultyProfile.id, subjectId: subDSP.id, sectionId: secECE5A.id },
    { facultyId: facultyMap['faculty.shenoy@logisys.edu'].facultyProfile.id, subjectId: subVLSI.id, sectionId: secECE5A.id },

    // AIML 5A
    { facultyId: facultyMap['faculty.murthy@logisys.edu'].facultyProfile.id, subjectId: subML.id, sectionId: secAIML5A.id },
    { facultyId: facultyMap['faculty.murthy@logisys.edu'].facultyProfile.id, subjectId: subNLP.id, sectionId: secAIML5A.id },
    { facultyId: facultyMap['faculty.murthy@logisys.edu'].facultyProfile.id, subjectId: subAILab.id, sectionId: secAIML5A.id },
  ];

  for (const a of assignments) {
    await prisma.facultyAssignment.create({
      data: {
        facultyId: a.facultyId,
        subjectId: a.subjectId,
        sectionId: a.sectionId,
        academicTermId: currentTerm.id,
      },
    });
  }

  // 9. Timetable
  console.log('🗓️ Seeding college master timetable...');
  const timetableEntries = [
    // CSE 5A
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', subjectId: subDSA.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '11:00', subjectId: subDBMS.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'MONDAY', startTime: '11:15', endTime: '12:15', subjectId: subCN.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'MONDAY', startTime: '12:15', endTime: '13:15', subjectId: subOS.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.kumar@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'MONDAY', startTime: '14:00', endTime: '16:00', subjectId: subWebLab.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, roomNumber: 'CS-LAB-2' },

    { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '10:00', subjectId: subDBMS.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '11:00', subjectId: subDSA.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'TUESDAY', startTime: '11:15', endTime: '12:15', subjectId: subOS.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.kumar@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'TUESDAY', startTime: '12:15', endTime: '13:15', subjectId: subCN.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },

    { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '10:00', subjectId: subCN.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '11:00', subjectId: subDBMS.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'WEDNESDAY', startTime: '11:15', endTime: '12:15', subjectId: subDSA.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },

    { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '10:00', subjectId: subOS.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.kumar@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '11:00', subjectId: subDSA.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'THURSDAY', startTime: '11:15', endTime: '12:15', subjectId: subDBMS.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'THURSDAY', startTime: '14:00', endTime: '16:00', subjectId: subWebLab.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.sharma@logisys.edu'].facultyProfile.id, roomNumber: 'CS-LAB-2' },

    { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '10:00', subjectId: subDSA.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'FRIDAY', startTime: '10:00', endTime: '11:00', subjectId: subCN.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.patel@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },
    { dayOfWeek: 'FRIDAY', startTime: '11:15', endTime: '12:15', subjectId: subOS.id, sectionId: secCSE5A.id, facultyId: facultyMap['faculty.kumar@logisys.edu'].facultyProfile.id, roomNumber: 'L-301' },

    // ISE 5A
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', subjectId: subCloud.id, sectionId: secISE5A.id, facultyId: facultyMap['faculty.raman@logisys.edu'].facultyProfile.id, roomNumber: 'IS-204' },
    { dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '11:00', subjectId: subSec.id, sectionId: secISE5A.id, facultyId: facultyMap['faculty.gowda@logisys.edu'].facultyProfile.id, roomNumber: 'IS-204' },
    { dayOfWeek: 'TUESDAY', startTime: '11:15', endTime: '12:15', subjectId: subCloud.id, sectionId: secISE5A.id, facultyId: facultyMap['faculty.raman@logisys.edu'].facultyProfile.id, roomNumber: 'IS-204' },

    // ECE 5A
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', subjectId: subEmbedded.id, sectionId: secECE5A.id, facultyId: facultyMap['faculty.deshpande@logisys.edu'].facultyProfile.id, roomNumber: 'EC-102' },
    { dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '11:00', subjectId: subDSP.id, sectionId: secECE5A.id, facultyId: facultyMap['faculty.shenoy@logisys.edu'].facultyProfile.id, roomNumber: 'EC-102' },

    // AIML 5A
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', subjectId: subML.id, sectionId: secAIML5A.id, facultyId: facultyMap['faculty.murthy@logisys.edu'].facultyProfile.id, roomNumber: 'AI-401' },
    { dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '11:00', subjectId: subNLP.id, sectionId: secAIML5A.id, facultyId: facultyMap['faculty.murthy@logisys.edu'].facultyProfile.id, roomNumber: 'AI-401' },
    { dayOfWeek: 'THURSDAY', startTime: '14:00', endTime: '16:00', subjectId: subAILab.id, sectionId: secAIML5A.id, facultyId: facultyMap['faculty.murthy@logisys.edu'].facultyProfile.id, roomNumber: 'AI-LAB-1' },
  ];

  await prisma.timetable.createMany({ data: timetableEntries });

  // 10. Students Roster across Departments
  console.log('🎓 Seeding 85+ students across multiple departments & sections...');

  const studentDefinitions = [
    // --- CSE 5A (22 students) ---
    { name: 'Rahul Verma', email: 'student.rahul@logisys.edu', usn: '1MS21CS089', roll: '21CS089', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Priya Nair', email: 'student.priya@logisys.edu', usn: '1MS21CS094', roll: '21CS094', dept: cseDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Arjun Mehta', email: 'student.arjun@logisys.edu', usn: '1MS21CS015', roll: '21CS015', dept: cseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Sneha Rao', email: 'sneha.rao@logisys.edu', usn: '1MS21CS112', roll: '21CS112', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Rohan Gupta', email: 'rohan.gupta@logisys.edu', usn: '1MS21CS099', roll: '21CS099', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Ananya Deshmukh', email: 'ananya.d@logisys.edu', usn: '1MS21CS012', roll: '21CS012', dept: cseDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Karthik Iyer', email: 'karthik.i@logisys.edu', usn: '1MS21CS054', roll: '21CS054', dept: cseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Pooja Hegde', email: 'pooja.h@logisys.edu', usn: '1MS21CS082', roll: '21CS082', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Vikram Singh', email: 'vikram.s@logisys.edu', usn: '1MS21CS134', roll: '21CS134', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Divya Bhat', email: 'divya.b@logisys.edu', usn: '1MS21CS038', roll: '21CS038', dept: cseDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Aditya Kulkarni', email: 'aditya.k@logisys.edu', usn: '1MS21CS005', roll: '21CS005', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Meera Nambiar', email: 'meera.n@logisys.edu', usn: '1MS21CS067', roll: '21CS067', dept: cseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Tanvi Joshi', email: 'tanvi.j@logisys.edu', usn: '1MS21CS125', roll: '21CS125', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Abhishek Roy', email: 'abhishek.r@logisys.edu', usn: '1MS21CS002', roll: '21CS002', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Naveen Reddy', email: 'naveen.r@logisys.edu', usn: '1MS21CS075', roll: '21CS075', dept: cseDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Shruti Pai', email: 'shruti.p@logisys.edu', usn: '1MS21CS108', roll: '21CS108', dept: cseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Manoj Kumar', email: 'manoj.k@logisys.edu', usn: '1MS21CS063', roll: '21CS063', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Bhavana Gowda', email: 'bhavana.g@logisys.edu', usn: '1MS21CS028', roll: '21CS028', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Varun Shenoy', email: 'varun.s@logisys.edu', usn: '1MS21CS130', roll: '21CS130', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Deepika S', email: 'deepika.s@logisys.edu', usn: '1MS21CS033', roll: '21CS033', dept: cseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Nikhil Patil', email: 'nikhil.patil@logisys.edu', usn: '1MS21CS077', roll: '21CS077', dept: cseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Swati Kamath', email: 'swati.k@logisys.edu', usn: '1MS21CS121', roll: '21CS121', dept: cseDept.id, sec: '5A', profile: 'EXCELLENT' },

    // --- CSE 5B (12 students) ---
    { name: 'Gautam Menon', email: 'gautam.m@logisys.edu', usn: '1MS21CS042', roll: '21CS042', dept: cseDept.id, sec: '5B', profile: 'GOOD' },
    { name: 'Ritu Sharma', email: 'ritu.s@logisys.edu', usn: '1MS21CS097', roll: '21CS097', dept: cseDept.id, sec: '5B', profile: 'EXCELLENT' },
    { name: 'Siddharth Rao', email: 'siddharth.r@logisys.edu', usn: '1MS21CS110', roll: '21CS110', dept: cseDept.id, sec: '5B', profile: 'LOW' },
    { name: 'Neha Varma', email: 'neha.v@logisys.edu', usn: '1MS21CS076', roll: '21CS076', dept: cseDept.id, sec: '5B', profile: 'GOOD' },
    { name: 'Pranav Joshi', email: 'pranav.j@logisys.edu', usn: '1MS21CS085', roll: '21CS085', dept: cseDept.id, sec: '5B', profile: 'GOOD' },
    { name: 'Akash Chopra', email: 'akash.c@logisys.edu', usn: '1MS21CS008', roll: '21CS008', dept: cseDept.id, sec: '5B', profile: 'EXCELLENT' },
    { name: 'Ishita Sen', email: 'ishita.s@logisys.edu', usn: '1MS21CS049', roll: '21CS049', dept: cseDept.id, sec: '5B', profile: 'GOOD' },
    { name: 'Tarun Reddy', email: 'tarun.r@logisys.edu', usn: '1MS21CS128', roll: '21CS128', dept: cseDept.id, sec: '5B', profile: 'LOW' },
    { name: 'Pallavi Das', email: 'pallavi.d@logisys.edu', usn: '1MS21CS080', roll: '21CS080', dept: cseDept.id, sec: '5B', profile: 'GOOD' },
    { name: 'Vivek Anand', email: 'vivek.a@logisys.edu', usn: '1MS21CS138', roll: '21CS138', dept: cseDept.id, sec: '5B', profile: 'EXCELLENT' },
    { name: 'Chaitra Hegde', email: 'chaitra.h@logisys.edu', usn: '1MS21CS030', roll: '21CS030', dept: cseDept.id, sec: '5B', profile: 'GOOD' },
    { name: 'Rohit Balaji', email: 'rohit.b@logisys.edu', usn: '1MS21CS101', roll: '21CS101', dept: cseDept.id, sec: '5B', profile: 'GOOD' },

    // --- ISE 5A (16 students) ---
    { name: 'Shreya Kulkarni', email: 'shreya.k@logisys.edu', usn: '1MS21IS045', roll: '21IS045', dept: iseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Naveen Prasad', email: 'naveen.p@logisys.edu', usn: '1MS21IS032', roll: '21IS032', dept: iseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Ankita Mishra', email: 'ankita.m@logisys.edu', usn: '1MS21IS009', roll: '21IS009', dept: iseDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Chethan Kumar', email: 'chethan.k@logisys.edu', usn: '1MS21IS014', roll: '21IS014', dept: iseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Keerthana R', email: 'keerthana.r@logisys.edu', usn: '1MS21IS025', roll: '21IS025', dept: iseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Rajeev Pillai', email: 'rajeev.p@logisys.edu', usn: '1MS21IS038', roll: '21IS038', dept: iseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Monika Rao', email: 'monika.r@logisys.edu', usn: '1MS21IS029', roll: '21IS029', dept: iseDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Vinay Bhat', email: 'vinay.b@logisys.edu', usn: '1MS21IS058', roll: '21IS058', dept: iseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Sanjay Gowda', email: 'sanjay.g@logisys.edu', usn: '1MS21IS041', roll: '21IS041', dept: iseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Harshitha M', email: 'harshitha.m@logisys.edu', usn: '1MS21IS021', roll: '21IS021', dept: iseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Praveen Naik', email: 'praveen.n@logisys.edu', usn: '1MS21IS035', roll: '21IS035', dept: iseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Aishwarya K', email: 'aishwarya.k@logisys.edu', usn: '1MS21IS004', roll: '21IS004', dept: iseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Sharath Mohan', email: 'sharath.m@logisys.edu', usn: '1MS21IS043', roll: '21IS043', dept: iseDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Tejaswini S', email: 'tejaswini.s@logisys.edu', usn: '1MS21IS052', roll: '21IS052', dept: iseDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Girish Prabhu', email: 'girish.p@logisys.edu', usn: '1MS21IS019', roll: '21IS019', dept: iseDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Archana V', email: 'archana.v@logisys.edu', usn: '1MS21IS011', roll: '21IS011', dept: iseDept.id, sec: '5A', profile: 'GOOD' },

    // --- ECE 5A (14 students) ---
    { name: 'Akshay Kamath', email: 'akshay.k@logisys.edu', usn: '1MS21EC007', roll: '21EC007', dept: eceDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Bhavya Hegde', email: 'bhavya.h@logisys.edu', usn: '1MS21EC018', roll: '21EC018', dept: eceDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Chandrashekar P', email: 'chandra.p@logisys.edu', usn: '1MS21EC024', roll: '21EC024', dept: eceDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Deeksha Pai', email: 'deeksha.p@logisys.edu', usn: '1MS21EC031', roll: '21EC031', dept: eceDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Eshwar Murthy', email: 'eshwar.m@logisys.edu', usn: '1MS21EC039', roll: '21EC039', dept: eceDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Gayatri Deshpande', email: 'gayatri.d@logisys.edu', usn: '1MS21EC046', roll: '21EC046', dept: eceDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Hemant Nambiar', email: 'hemant.n@logisys.edu', usn: '1MS21EC052', roll: '21EC052', dept: eceDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Jyothi Raman', email: 'jyothi.r@logisys.edu', usn: '1MS21EC060', roll: '21EC060', dept: eceDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Kiran Shenoy', email: 'kiran.s@logisys.edu', usn: '1MS21EC068', roll: '21EC068', dept: eceDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Lavanya Bhat', email: 'lavanya.b@logisys.edu', usn: '1MS21EC074', roll: '21EC074', dept: eceDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Mohan Kumar', email: 'mohan.k@logisys.edu', usn: '1MS21EC082', roll: '21EC082', dept: eceDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Nandini Rao', email: 'nandini.r@logisys.edu', usn: '1MS21EC089', roll: '21EC089', dept: eceDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Prashant Nayak', email: 'prashant.n@logisys.edu', usn: '1MS21EC096', roll: '21EC096', dept: eceDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Roopa Acharya', email: 'roopa.a@logisys.edu', usn: '1MS21EC105', roll: '21EC105', dept: eceDept.id, sec: '5A', profile: 'EXCELLENT' },

    // --- AIML 5A (14 students) ---
    { name: 'Aarav Singhal', email: 'aarav.s@logisys.edu', usn: '1MS21AI003', roll: '21AI003', dept: aimlDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Diya Kapoor', email: 'diya.k@logisys.edu', usn: '1MS21AI015', roll: '21AI015', dept: aimlDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Ishaan Verma', email: 'ishaan.v@logisys.edu', usn: '1MS21AI024', roll: '21AI024', dept: aimlDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Kavya Iyer', email: 'kavya.i@logisys.edu', usn: '1MS21AI032', roll: '21AI032', dept: aimlDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Madhav Namboodiri', email: 'madhav.n@logisys.edu', usn: '1MS21AI041', roll: '21AI041', dept: aimlDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Nandita Sen', email: 'nandita.s@logisys.edu', usn: '1MS21AI049', roll: '21AI049', dept: aimlDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Ojas Patil', email: 'ojas.p@logisys.edu', usn: '1MS21AI056', roll: '21AI056', dept: aimlDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Prisha Saxena', email: 'prisha.s@logisys.edu', usn: '1MS21AI063', roll: '21AI063', dept: aimlDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Rishi Vohra', email: 'rishi.v@logisys.edu', usn: '1MS21AI071', roll: '21AI071', dept: aimlDept.id, sec: '5A', profile: 'LOW' },
    { name: 'Saanvi Trivedi', email: 'saanvi.t@logisys.edu', usn: '1MS21AI080', roll: '21AI080', dept: aimlDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Tanmay Pillai', email: 'tanmay.p@logisys.edu', usn: '1MS21AI088', roll: '21AI088', dept: aimlDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Urvi Menon', email: 'urvi.m@logisys.edu', usn: '1MS21AI095', roll: '21AI095', dept: aimlDept.id, sec: '5A', profile: 'EXCELLENT' },
    { name: 'Vivaan Joshi', email: 'vivaan.j@logisys.edu', usn: '1MS21AI102', roll: '21AI102', dept: aimlDept.id, sec: '5A', profile: 'GOOD' },
    { name: 'Zoya Khan', email: 'zoya.k@logisys.edu', usn: '1MS21AI110', roll: '21AI110', dept: aimlDept.id, sec: '5A', profile: 'GOOD' },
  ];

  const allCreatedStudents = [];

  for (const s of studentDefinitions) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: studentPasswordHash,
        name: s.name,
        role: 'STUDENT',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`,
        studentProfile: {
          create: {
            usn: s.usn,
            departmentId: s.dept,
            semester: 5,
            section: s.sec,
            rollNo: s.roll,
            contactNo: '+91 97' + Math.floor(10000000 + Math.random() * 90000000),
            guardianName: s.name.split(' ')[1] ? `Mr. ${s.name.split(' ')[1]}` : 'Guardian',
            guardianContact: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
            academicBatch: '2023-2027',
          },
        },
      },
      include: { studentProfile: true },
    });

    allCreatedStudents.push({ ...user, profileType: s.profile });

    // Enroll student in department's subjects
    let subjectsToEnroll = [];
    if (s.dept === cseDept.id) subjectsToEnroll = cseSubjects;
    else if (s.dept === iseDept.id) subjectsToEnroll = iseSubjects;
    else if (s.dept === eceDept.id) subjectsToEnroll = eceSubjects;
    else if (s.dept === aimlDept.id) subjectsToEnroll = aimlSubjects;

    for (const sub of subjectsToEnroll) {
      await prisma.enrollment.create({
        data: {
          studentId: user.studentProfile.id,
          subjectId: sub.id,
          academicTermId: currentTerm.id,
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Successfully created and enrolled ${allCreatedStudents.length} students across 4 departments.`);

  // 11. Generate Extensive Historical Class Sessions & Attendance Records
  console.log('📅 Simulating 250+ class sessions and thousands of attendance entries...');

  const sessionConfigs = [
    // CSE 5A
    { subject: subDSA, section: secCSE5A, faculty: facultyMap['faculty.patel@logisys.edu'].facultyProfile, totalSessions: 42, time: '09:00 - 10:00' },
    { subject: subDBMS, section: secCSE5A, faculty: facultyMap['faculty.sharma@logisys.edu'].facultyProfile, totalSessions: 38, time: '10:00 - 11:00' },
    { subject: subCN, section: secCSE5A, faculty: facultyMap['faculty.patel@logisys.edu'].facultyProfile, totalSessions: 40, time: '11:15 - 12:15' },
    { subject: subOS, section: secCSE5A, faculty: facultyMap['faculty.kumar@logisys.edu'].facultyProfile, totalSessions: 36, time: '12:15 - 13:15' },
    { subject: subWebLab, section: secCSE5A, faculty: facultyMap['faculty.sharma@logisys.edu'].facultyProfile, totalSessions: 14, time: '14:00 - 16:00', type: 'LAB' },

    // CSE 5B
    { subject: subDSA, section: secCSE5B, faculty: facultyMap['faculty.patel@logisys.edu'].facultyProfile, totalSessions: 30, time: '10:00 - 11:00' },
    { subject: subDBMS, section: secCSE5B, faculty: facultyMap['faculty.sharma@logisys.edu'].facultyProfile, totalSessions: 30, time: '11:15 - 12:15' },

    // ISE 5A
    { subject: subCloud, section: secISE5A, faculty: facultyMap['faculty.raman@logisys.edu'].facultyProfile, totalSessions: 35, time: '09:00 - 10:00' },
    { subject: subSec, section: secISE5A, faculty: facultyMap['faculty.gowda@logisys.edu'].facultyProfile, totalSessions: 32, time: '10:00 - 11:00' },

    // ECE 5A
    { subject: subEmbedded, section: secECE5A, faculty: facultyMap['faculty.deshpande@logisys.edu'].facultyProfile, totalSessions: 34, time: '09:00 - 10:00' },
    { subject: subDSP, section: secECE5A, faculty: facultyMap['faculty.shenoy@logisys.edu'].facultyProfile, totalSessions: 32, time: '10:00 - 11:00' },

    // AIML 5A
    { subject: subML, section: secAIML5A, faculty: facultyMap['faculty.murthy@logisys.edu'].facultyProfile, totalSessions: 35, time: '09:00 - 10:00' },
    { subject: subNLP, section: secAIML5A, faculty: facultyMap['faculty.murthy@logisys.edu'].facultyProfile, totalSessions: 32, time: '10:00 - 11:00' },
  ];

  let totalSessionsCreated = 0;
  let totalRecordsCreated = 0;
  let priyaRecentSession = null;
  let rahulRecentSession = null;

  for (const config of sessionConfigs) {
    const { subject, section, faculty, totalSessions, time, type } = config;

    // Filter students enrolled in this section and department
    const sectionStudents = allCreatedStudents.filter(
      (s) => s.studentProfile.departmentId === section.departmentId && s.studentProfile.section === section.name
    );

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 55);

    let sessionCounter = 0;
    let dayOffset = 0;

    while (sessionCounter < totalSessions && dayOffset < 55) {
      const sessionDate = new Date(baseDate);
      sessionDate.setDate(baseDate.getDate() + dayOffset);
      dayOffset++;

      // Skip Sundays
      if (sessionDate.getDay() === 0) continue;

      sessionCounter++;

      const session = await prisma.classSession.create({
        data: {
          subjectId: subject.id,
          sectionId: section.id,
          facultyId: faculty.id,
          date: sessionDate,
          timeSlot: time,
          topicCovered: `Unit ${Math.min(5, Math.ceil(sessionCounter / 8))}: Module ${sessionCounter} Interactive Discussion`,
          sessionType: type || 'REGULAR',
          isLocked: sessionCounter < totalSessions,
          lockedAt: sessionCounter < totalSessions ? sessionDate : null,
        },
      });

      totalSessionsCreated++;
      if (section.name === '5A' && section.departmentId === cseDept.id) {
        if (!priyaRecentSession) priyaRecentSession = session;
        rahulRecentSession = session;
      }

      // Mark records for each student in this section
      for (const st of sectionStudents) {
        let status = 'PRESENT';
        const profile = st.profileType;
        const seedCode = (sessionCounter * 19 + st.studentProfile.usn.charCodeAt(st.studentProfile.usn.length - 1)) % 100;

        if (profile === 'EXCELLENT') {
          if (seedCode > 94) status = 'ABSENT';
          else if (seedCode === 93) status = 'LEAVE';
        } else if (profile === 'GOOD') {
          if (seedCode > 82) status = 'ABSENT';
          else if (seedCode > 78) status = 'LEAVE';
        } else if (profile === 'LOW') {
          // Attendance around 62-69% (triggers low attendance shortage badge)
          if (seedCode > 66) status = 'ABSENT';
          else if (seedCode > 62) status = 'LEAVE';
        }

        // Custom exact percentages for demo students
        if (st.studentProfile.usn === '1MS21CS094' && subject.code === 'CS502') {
          // Priya DBMS exact shortage: 25 / 38 = 65.78%
          status = sessionCounter <= 25 ? 'PRESENT' : 'ABSENT';
        }
        if (st.studentProfile.usn === '1MS21CS089' && subject.code === 'CS501') {
          // Rahul DSA: 35 / 42 = 83.33%
          status = sessionCounter <= 35 ? 'PRESENT' : 'ABSENT';
        }

        await prisma.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: st.studentProfile.id,
            status,
            remarks: status === 'LEAVE' ? 'Authorized Medical/OD Leave' : null,
            markedById: faculty.userId,
          },
        });

        totalRecordsCreated++;
      }
    }
  }

  console.log(`✅ Created ${totalSessionsCreated} total sessions and ${totalRecordsCreated} attendance records!`);

  // 12. Multiple Correction Requests & Grievances
  console.log('📝 Seeding realistic attendance correction requests...');
  const priyaStudent = allCreatedStudents.find((s) => s.email === 'student.priya@logisys.edu').studentProfile;
  const rahulStudent = allCreatedStudents.find((s) => s.email === 'student.rahul@logisys.edu').studentProfile;
  const ananyaStudent = allCreatedStudents.find((s) => s.email === 'ananya.d@logisys.edu').studentProfile;
  const siddharthStudent = allCreatedStudents.find((s) => s.email === 'siddharth.r@logisys.edu').studentProfile;

  await prisma.attendanceCorrectionRequest.create({
    data: {
      studentId: priyaStudent.id,
      sessionId: priyaRecentSession.id,
      currentStatus: 'ABSENT',
      requestedStatus: 'PRESENT',
      reason: 'Represented College at VTU State Inter-Collegiate Basketball Tournament in Belagavi. OD application verified by Physical Education Director.',
      proofDocUrl: '/uploads/proofs/vtu_sports_od_certificate.pdf',
      status: 'PENDING',
    },
  });

  await prisma.attendanceCorrectionRequest.create({
    data: {
      studentId: rahulStudent.id,
      sessionId: rahulRecentSession.id,
      currentStatus: 'ABSENT',
      requestedStatus: 'LEAVE',
      reason: 'Acute gastroenteritis and dehydration. 3 days hospitalization certificate attached.',
      proofDocUrl: '/uploads/proofs/medical_cert_rahul_hospital.pdf',
      status: 'APPROVED',
      reviewedById: adminUser.id,
      reviewRemarks: 'Verified with proctor records and medical documentation. Leave sanctioned.',
    },
  });

  await prisma.attendanceCorrectionRequest.create({
    data: {
      studentId: ananyaStudent.id,
      sessionId: priyaRecentSession.id,
      currentStatus: 'ABSENT',
      requestedStatus: 'PRESENT',
      reason: 'Participated in Smart India Hackathon internal university presentation round.',
      proofDocUrl: 'https://drive.google.com/file/d/sih_od_proof_2026/view',
      status: 'PENDING',
    },
  });

  await prisma.attendanceCorrectionRequest.create({
    data: {
      studentId: siddharthStudent.id,
      sessionId: rahulRecentSession.id,
      currentStatus: 'ABSENT',
      requestedStatus: 'PRESENT',
      reason: 'Forgot to swipe ID card before 9:05 AM due to bus breakdown on Outer Ring Road.',
      status: 'REJECTED',
      reviewedById: adminUser.id,
      reviewRemarks: 'Traffic delays do not qualify for official attendance reconciliation per university ordinance.',
    },
  });

  // 13. System Notifications
  console.log('🔔 Seeding notifications for students, faculty & administrators...');
  const priyaUser = allCreatedStudents.find((s) => s.email === 'student.priya@logisys.edu');
  const rahulUser = allCreatedStudents.find((s) => s.email === 'student.rahul@logisys.edu');
  const facultySharma = facultyMap['faculty.sharma@logisys.edu'];
  const facultyPatel = facultyMap['faculty.patel@logisys.edu'];

  await prisma.notification.createMany({
    data: [
      // Priya's notifications
      {
        userId: priyaUser.id,
        title: '⚠️ Critical Attendance Shortage Warning',
        message: 'Your attendance in CS502 (DBMS) is currently 65.78%, below the statutory 75% requirement. Attend consecutive sessions to avoid examination detention.',
        type: 'WARNING',
        isRead: false,
        link: '/student/calculator',
      },
      {
        userId: priyaUser.id,
        title: 'Mid-Term Exam Eligibility Notice',
        message: 'Hall tickets for Odd Semester Mid-Term Assessments will only be issued to candidates having >= 75% attendance.',
        type: 'INFO',
        isRead: true,
        link: '/student/attendance',
      },
      {
        userId: priyaUser.id,
        title: 'Sports OD Request Received',
        message: 'Your correction request for VTU Basketball tournament is in administrative queue.',
        type: 'INFO',
        isRead: false,
        link: '/student/requests',
      },

      // Rahul's notifications
      {
        userId: rahulUser.id,
        title: 'Attendance Correction Approved',
        message: 'Your medical leave correction request for CS501 has been reviewed and approved by the Academic Administrator.',
        type: 'SUCCESS',
        isRead: false,
        link: '/student/attendance',
      },
      {
        userId: rahulUser.id,
        title: 'Upcoming Internal Assessment Test 2',
        message: 'IAT-2 timetable is live on the portal. Data Structures examination is scheduled on next Monday at 09:30 AM.',
        type: 'INFO',
        isRead: true,
        link: '/student/timetable',
      },

      // Faculty Notifications
      {
        userId: facultySharma.id,
        title: 'Monthly Attendance Finalization Deadline',
        message: 'Kindly review and lock all pending attendance sheets for Section 5A and 5B before the month-end audit.',
        type: 'INFO',
        isRead: false,
        link: '/faculty/attendance',
      },
      {
        userId: facultyPatel.id,
        title: 'Lab Session Reschedule Notice',
        message: 'CS505L Web Technology Lab will commence from 2:00 PM in CS-LAB-2 on Thursday.',
        type: 'INFO',
        isRead: false,
        link: '/faculty/timetable',
      },

      // Admin Notifications
      {
        userId: adminUser.id,
        title: 'Pending Attendance Grievances',
        message: 'You have 2 student attendance correction requests awaiting review and adjudication.',
        type: 'WARNING',
        isRead: false,
        link: '/admin/corrections',
      },
    ],
  });

  // 14. Detailed Audit Trail
  console.log('📜 Seeding administrative audit trail...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_INITIALIZATION',
        entity: 'SystemSetting',
        entityId: 'SYSTEM',
        details: 'Initialized academic term Odd Semester 2026-27 with 75% mandatory threshold.',
        ipAddress: '127.0.0.1',
      },
      {
        userId: adminUser.id,
        action: 'BULK_STUDENT_IMPORT',
        entity: 'StudentProfile',
        details: 'Enrolled 86 students across CSE, ISE, ECE, and AIML programs.',
        ipAddress: '10.0.4.15',
      },
      {
        userId: facultySharma.id,
        action: 'ATTENDANCE_LOCKED',
        entity: 'ClassSession',
        entityId: priyaRecentSession.id,
        details: 'Marked and locked attendance for CS502 Section 5A (22 students evaluated).',
        ipAddress: '192.168.1.45',
      },
      {
        userId: adminUser.id,
        action: 'CORRECTION_APPROVED',
        entity: 'AttendanceCorrectionRequest',
        details: 'Approved medical leave request for student Rahul Verma (1MS21CS089).',
        ipAddress: '127.0.0.1',
      },
      {
        userId: adminUser.id,
        action: 'CORRECTION_REJECTED',
        entity: 'AttendanceCorrectionRequest',
        details: 'Rejected transit delay excuse for student Siddharth Rao (1MS21CS110).',
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('✨ Comprehensive database seed finished! College database is rich and ready.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 2. Create Users (1 Admin, 2 PMs, 4 Developers)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@velozity.com',
      name: 'Sarah Admin',
      role: Role.ADMIN,
      passwordHash: defaultPassword,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'pm1@velozity.com',
      name: 'Priya Sharma (PM)',
      role: Role.PROJECT_MANAGER,
      passwordHash: defaultPassword,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'pm2@velozity.com',
      name: 'David Miller (PM)',
      role: Role.PROJECT_MANAGER,
      passwordHash: defaultPassword,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'dev1@velozity.com',
      name: 'Ravi Kumar (Dev)',
      role: Role.DEVELOPER,
      passwordHash: defaultPassword,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'dev2@velozity.com',
      name: 'Anita Patel (Dev)',
      role: Role.DEVELOPER,
      passwordHash: defaultPassword,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'dev3@velozity.com',
      name: 'Carlos Mendez (Dev)',
      role: Role.DEVELOPER,
      passwordHash: defaultPassword,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'dev4@velozity.com',
      name: 'Emily Chen (Dev)',
      role: Role.DEVELOPER,
      passwordHash: defaultPassword,
    },
  });

  console.log('✅ Created 7 Users: 1 Admin, 2 PMs, 4 Developers');

  // 3. Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Acme Global Corp',
      email: 'contact@acme.com',
      company: 'Acme Corporation',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Nexus Financial Inc',
      email: 'contact@nexusfin.com',
      company: 'Nexus Financial',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Apex HealthTech Group',
      email: 'support@apexhealth.io',
      company: 'Apex HealthTech',
    },
  });

  console.log('✅ Created 3 Clients');

  // 4. Create 3 Projects (PM1 owns 2, PM2 owns 1)
  const project1 = await prisma.project.create({
    data: {
      name: 'E-Commerce Checkout Revamp',
      description: 'Migrating legacy checkout flow to React and Stripe Elements with 3D Secure 2.0',
      clientId: client1.id,
      ownerId: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile Banking Security Suite',
      description: 'Biometric authorization, fraud detection microservice, and zero-trust API gateway',
      clientId: client2.id,
      ownerId: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Patient Telehealth Portal',
      description: 'HIPAA-compliant WebRTC video consultations and secure prescription exchange',
      clientId: client3.id,
      ownerId: pm2.id,
    },
  });

  console.log('✅ Created 3 Projects with distinct PM ownership');

  // Dates helpers
  const pastDate1 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago (OVERDUE)
  const pastDate2 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago (OVERDUE)
  const upcomingThisWeek1 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // in 2 days
  const upcomingThisWeek2 = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000); // in 4 days
  const nextMonth = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000); // next month

  // 5. Create Tasks (at least 5 per project = 16 tasks total, including overdue tasks)
  // Project 1 Tasks
  const p1t1 = await prisma.task.create({
    data: {
      title: 'Integrate Stripe PaymentIntent API',
      description: 'Implement server-side payment confirmation with idempotency keys',
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate1,
      isOverdue: true, // OVERDUE 1
    },
  });

  const p1t2 = await prisma.task.create({
    data: {
      title: 'Design Cart Abandonment Recovery Modal',
      description: 'Show exit-intent discount modal when cursor leaves checkout viewport',
      projectId: project1.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: upcomingThisWeek1,
      isOverdue: false,
    },
  });

  const p1t3 = await prisma.task.create({
    data: {
      title: 'Tax Calculation Engine Integration',
      description: 'Connect with Avalara Tax API for dynamic regional sales tax calculations',
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: pastDate2,
      isOverdue: false,
    },
  });

  const p1t4 = await prisma.task.create({
    data: {
      title: 'Multi-Currency Selector Component',
      description: 'Support USD, EUR, GBP and JPY with cached real-time exchange rates',
      projectId: project1.id,
      assignedToId: dev3.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: nextMonth,
      isOverdue: false,
    },
  });

  const p1t5 = await prisma.task.create({
    data: {
      title: 'End-to-End Cypress Tests for Order Flow',
      description: 'Automate checkout tests covering coupon application and payment failure handling',
      projectId: project1.id,
      assignedToId: dev4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: upcomingThisWeek2,
      isOverdue: false,
    },
  });

  // Project 2 Tasks
  const p2t1 = await prisma.task.create({
    data: {
      title: 'Implement WebAuthn Biometric Handshake',
      description: 'FIDO2 compliant FaceID and TouchID credentials registration',
      projectId: project2.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate2,
      isOverdue: true, // OVERDUE 2
    },
  });

  const p2t2 = await prisma.task.create({
    data: {
      title: 'Rate-Limit Shield with Sliding Window Redis',
      description: 'Protect sensitive transfer endpoints from brute force and credential stuffing',
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: upcomingThisWeek1,
      isOverdue: false,
    },
  });

  const p2t3 = await prisma.task.create({
    data: {
      title: 'Audit Log Archival Pipeline',
      description: 'Stream tamper-evident audit logs to cold immutable S3 glacier storage',
      projectId: project2.id,
      assignedToId: dev4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: nextMonth,
      isOverdue: false,
    },
  });

  const p2t4 = await prisma.task.create({
    data: {
      title: 'Mutual TLS Between Microservices',
      description: 'Issue short-lived internal certificates with HashiCorp Vault',
      projectId: project2.id,
      assignedToId: dev2.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate1,
      isOverdue: false,
    },
  });

  const p2t5 = await prisma.task.create({
    data: {
      title: 'Device Fingerprinting & Anomaly Detection',
      description: 'Analyze browser entropy and geo-velocity to detect rogue logins',
      projectId: project2.id,
      assignedToId: dev1.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: upcomingThisWeek2,
      isOverdue: false,
    },
  });

  // Project 3 Tasks (Owned by PM2 - David Miller)
  const p3t1 = await prisma.task.create({
    data: {
      title: 'WebRTC Signaling Server Setup',
      description: 'Establish secure WebSocket mesh for peer-to-peer encrypted video calls',
      projectId: project3.id,
      assignedToId: dev3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: upcomingThisWeek1,
      isOverdue: false,
    },
  });

  const p3t2 = await prisma.task.create({
    data: {
      title: 'Doctor Schedule Booking Calendar',
      description: 'Interactive time-slot reservation with timezone auto-normalization',
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: pastDate1,
      isOverdue: true, // OVERDUE 3
    },
  });

  const p3t3 = await prisma.task.create({
    data: {
      title: 'E-Prescription PDF Generator',
      description: 'Digitally signed medical prescription generation with QR verification',
      projectId: project3.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: upcomingThisWeek2,
      isOverdue: false,
    },
  });

  const p3t4 = await prisma.task.create({
    data: {
      title: 'HIPAA Consent Form Digital Signature',
      description: 'Canvas-based signature pad and tamper-proof SHA-256 consent record',
      projectId: project3.id,
      assignedToId: dev2.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: pastDate2,
      isOverdue: false,
    },
  });

  const p3t5 = await prisma.task.create({
    data: {
      title: 'SMS Reminder Automation with Twilio',
      description: 'Send automated appointment alerts 2 hours prior to consultation',
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: nextMonth,
      isOverdue: false,
    },
  });

  console.log('✅ Created 15 Tasks across 3 Projects (including 3 overdue tasks)');

  // 6. Pre-existing Activity Log Entries
  await prisma.activityLog.createMany({
    data: [
      {
        taskId: p1t1.id,
        projectId: project1.id,
        userId: dev1.id,
        previousStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        message: `${dev1.name} moved Task #${p1t1.taskNumber} from To Do -> In Progress`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 5),
      },
      {
        taskId: p1t2.id,
        projectId: project1.id,
        userId: dev2.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        message: `${dev2.name} moved Task #${p1t2.taskNumber} from In Progress -> In Review`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 4),
      },
      {
        taskId: p1t3.id,
        projectId: project1.id,
        userId: dev1.id,
        previousStatus: TaskStatus.IN_REVIEW,
        newStatus: TaskStatus.DONE,
        message: `${dev1.name} moved Task #${p1t3.taskNumber} from In Review -> Done`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 3),
      },
      {
        taskId: p2t1.id,
        projectId: project2.id,
        userId: dev2.id,
        previousStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        message: `${dev2.name} moved Task #${p2t1.taskNumber} from To Do -> In Progress`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      },
      {
        taskId: p2t2.id,
        projectId: project2.id,
        userId: dev3.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        message: `${dev3.name} moved Task #${p2t2.taskNumber} from In Progress -> In Review`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1.5),
      },
      {
        taskId: p3t1.id,
        projectId: project3.id,
        userId: dev3.id,
        previousStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        message: `${dev3.name} moved Task #${p3t1.taskNumber} from To Do -> In Progress`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 1),
      },
      {
        taskId: p3t3.id,
        projectId: project3.id,
        userId: dev1.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        message: `${dev1.name} moved Task #${p3t3.taskNumber} from In Progress -> In Review`,
        createdAt: new Date(Date.now() - 3600 * 1000 * 0.5),
      },
    ],
  });

  console.log('✅ Created initial Activity Log records');

  // 7. Initial In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: dev1.id,
        taskId: p1t1.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: 'You were assigned to "Integrate Stripe PaymentIntent API"',
        isRead: false,
        createdAt: new Date(Date.now() - 3600 * 1000 * 6),
      },
      {
        userId: pm1.id,
        taskId: p1t2.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Moved to In Review',
        message: `Task #${p1t2.taskNumber} ("Design Cart Abandonment Recovery Modal") is ready for your review`,
        isRead: false,
        createdAt: new Date(Date.now() - 3600 * 1000 * 4),
      },
      {
        userId: pm1.id,
        taskId: p2t2.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Moved to In Review',
        message: `Task #${p2t2.taskNumber} ("Rate-Limit Shield with Sliding Window Redis") is ready for your review`,
        isRead: true,
        createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      },
      {
        userId: pm2.id,
        taskId: p3t3.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: 'Task Moved to In Review',
        message: `Task #${p3t3.taskNumber} ("E-Prescription PDF Generator") is ready for your review`,
        isRead: false,
        createdAt: new Date(Date.now() - 3600 * 1000 * 0.5),
      },
    ],
  });

  console.log('✅ Created initial Notifications');
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

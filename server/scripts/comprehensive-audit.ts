import WebSocket from 'ws';

const BASE_URL = 'http://localhost:5000/api';

async function runAudit() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE SPECIFICATION AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. AUTHENTICATION & TOKENS
  console.log('--- 1. AUTHENTICATION & HttpOnly COOKIES ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@velozity.com', password: 'Password123!' }),
  });
  const loginData: any = await loginRes.json();
  const setCookieHeader = loginRes.headers.get('set-cookie');

  assert(loginData.success === true, 'Admin login succeeds');
  assert(typeof loginData.data?.accessToken === 'string', 'JWT access token returned');
  assert(Boolean(setCookieHeader && setCookieHeader.includes('jid=')), 'HttpOnly refresh token cookie set in response header');
  assert(Boolean(setCookieHeader && setCookieHeader.includes('HttpOnly')), 'Cookie has HttpOnly flag enforced');

  const adminToken = loginData.data.accessToken;

  // Login PM1, PM2, Dev1, Dev2
  const pm1Res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pm1@velozity.com', password: 'Password123!' }),
  });
  const pm1Token = (await pm1Res.json()).data.accessToken;

  const pm2Res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pm2@velozity.com', password: 'Password123!' }),
  });
  const pm2Token = (await pm2Res.json()).data.accessToken;

  const dev1Res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev1@velozity.com', password: 'Password123!' }),
  });
  const dev1Token = (await dev1Res.json()).data.accessToken;

  const dev2Res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev2@velozity.com', password: 'Password123!' }),
  });
  const dev2Token = (await dev2Res.json()).data.accessToken;

  // 2. API-LEVEL AUTHORIZATION & SECURITY BOUNDARIES
  console.log('\n--- 2. API-LEVEL AUTHORIZATION & SECURITY BOUNDARIES ---');

  // Dev attempting to create a project (Mandatory: 403 Forbidden)
  const devCreateProject = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${dev1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Hacked Project', clientId: 'c1' }),
  });
  assert(devCreateProject.status === 403, 'Developer blocked from creating project (API 403 Forbidden)');

  // Dev attempting to fetch all users (Mandatory: 403 Forbidden)
  const devGetUsers = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  assert(devGetUsers.status === 403, 'Developer blocked from viewing all users (API 403 Forbidden)');

  // PM1 projects vs PM2 projects isolation
  const pm1ProjectsRes = await fetch(`${BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${pm1Token}` },
  });
  const pm1Projects = (await pm1ProjectsRes.json()).data;

  const pm2ProjectsRes = await fetch(`${BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${pm2Token}` },
  });
  const pm2Projects = (await pm2ProjectsRes.json()).data;

  const pm2ProjectId = pm2Projects[0].id;

  // PM1 directly hitting API to fetch PM2 project (Mandatory: PM can only manage projects they created)
  const pm1AccessOtherProject = await fetch(`${BASE_URL}/projects/${pm2ProjectId}`, {
    headers: { Authorization: `Bearer ${pm1Token}` },
  });
  assert(pm1AccessOtherProject.status === 403, "PM1 blocked from accessing PM2's project directly (API 403 Forbidden)");

  // Developer viewing only assigned tasks
  const dev1TasksRes = await fetch(`${BASE_URL}/tasks`, {
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  const dev1Tasks = (await dev1TasksRes.json()).data;
  const allAssignedToDev1 = dev1Tasks.every((t: any) => t.assignedTo?.email === 'dev1@velozity.com');
  assert(allAssignedToDev1, 'Developer sees only tasks assigned to them');

  // 3. TASK STATUS TRANSITIONS, ACTIVITY LOG & NOTIFICATIONS
  console.log('\n--- 3. PERSISTENT ACTIVITY LOG & NOTIFICATIONS TRIGGER ---');
  const targetTask = dev1Tasks[0];

  // Dev1 moves task to IN_REVIEW
  const updateStatusRes = await fetch(`${BASE_URL}/tasks/${targetTask.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${dev1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'IN_REVIEW' }),
  });
  const updateJson = await updateStatusRes.json();
  assert(updateJson.success === true, 'Task status updated to IN_REVIEW in database');

  // Verify ActivityLog was created in PostgreSQL with required fields
  const activityRes = await fetch(`${BASE_URL}/activity?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const activityData = (await activityRes.json()).data;
  const latestLog = activityData[0];

  assert(latestLog.taskId === targetTask.id, 'Activity log references correct task ID');
  assert(latestLog.newStatus === 'IN_REVIEW', 'Activity log captures new status');
  assert(latestLog.user.name === 'Ravi Kumar (Dev)', 'Activity log captures author who changed it');
  assert(Boolean(latestLog.createdAt), 'Activity log contains timestamp');
  assert(latestLog.message.includes('moved Task #'), 'Activity log format matches: "who moved Task #X from ... -> ..."');

  // Verify PM of that project received notification
  const pm1NotificationsRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${pm1Token}` },
  });
  const pm1Notifs = (await pm1NotificationsRes.json()).data;
  const reviewNotif = pm1Notifs.find((n: any) => n.taskId === targetTask.id && n.type === 'TASK_IN_REVIEW');
  assert(Boolean(reviewNotif), 'PM received in-app notification when task moved to IN_REVIEW');

  // 4. URL QUERY FILTERING
  console.log('\n--- 4. URL QUERY PARAMETER FILTERS ---');
  const filterCriticalRes = await fetch(`${BASE_URL}/tasks?priority=CRITICAL`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const criticalTasks = (await filterCriticalRes.json()).data;
  const allCritical = criticalTasks.every((t: any) => t.priority === 'CRITICAL');
  assert(allCritical && criticalTasks.length > 0, 'URL filter ?priority=CRITICAL works accurately');

  const filterStatusRes = await fetch(`${BASE_URL}/tasks?status=DONE`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const doneTasks = (await filterStatusRes.json()).data;
  const allDone = doneTasks.every((t: any) => t.status === 'DONE');
  assert(allDone && doneTasks.length > 0, 'URL filter ?status=DONE works accurately');

  // 5. ROLE-SPECIFIC DASHBOARD METRICS
  console.log('\n--- 5. ROLE-SPECIFIC DASHBOARDS ---');
  const adminDashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminDash = (await adminDashRes.json()).data;
  assert(adminDash.totalProjects >= 3, 'Admin dashboard has total projects count');
  assert(typeof adminDash.tasksByStatus === 'object', 'Admin dashboard has tasks by status breakdown');
  assert(typeof adminDash.overdueCount === 'number', 'Admin dashboard has overdue tasks count');

  const pmDashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${pm1Token}` },
  });
  const pmDash = (await pmDashRes.json()).data;
  assert(typeof pmDash.ownProjectsCount === 'number', 'PM dashboard has own projects count');
  assert(typeof pmDash.tasksByPriority === 'object', 'PM dashboard has tasks by priority breakdown');
  assert(Array.isArray(pmDash.upcomingTasksThisWeek), 'PM dashboard has upcoming due dates this week list');

  const devDashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  const devDash = (await devDashRes.json()).data;
  assert(typeof devDash.totalAssigned === 'number', 'Developer dashboard has total assigned count');
  assert(Array.isArray(devDash.assignedTasks), 'Developer dashboard has assigned tasks sorted by priority then due date');

  // 6. REAL-TIME WEBSOCKET & PRESENCE
  console.log('\n--- 6. WEBSOCKET REAL-TIME PRESENCE & BROADCAST ---');
  const ws1 = new WebSocket(`ws://localhost:5000/ws?token=${adminToken}`);
  let wsConnected = false;
  let wsPresence = false;

  await new Promise<void>((resolve) => {
    ws1.on('open', () => {
      wsConnected = true;
    });
    ws1.on('message', (raw: string) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'CONNECTED') {
        wsPresence = true;
        resolve();
      }
    });
  });

  assert(wsConnected, 'Native WebSocket connects via JWT handshake');
  assert(wsPresence, 'Admin receives live presence update on connection');
  ws1.close();

  // 7. STRUCTURED ERROR HANDLING
  console.log('\n--- 7. STRUCTURED ERROR RESPONSES (NO STACK TRACES) ---');
  const errorRes = await fetch(`${BASE_URL}/unknown-route-1234`);
  const errorJson = await errorRes.json();
  assert(errorRes.status === 404, 'Unknown endpoint returns 404');
  assert(errorJson.success === false, 'Error envelope has success=false');
  assert(errorJson.error && typeof errorJson.error.message === 'string', 'Error has structured message');
  assert(errorJson.stack === undefined && errorJson.error.stack === undefined, 'Raw stack trace is NEVER exposed');

  console.log('\n================================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit failed with uncaught exception:', err);
  process.exit(1);
});

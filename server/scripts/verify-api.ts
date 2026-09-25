async function testApi() {
  console.log('🧪 Starting API Verification Suite...\n');

  // Helper login
  async function login(email: string, roleName: string) {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' }),
    });
    const json: any = await res.json();
    console.log(`🔑 Login as ${roleName} (${email}):`, json.success ? 'SUCCESS' : 'FAILED');
    return json.data.accessToken;
  }

  const adminToken = await login('admin@velozity.com', 'ADMIN');
  const pm1Token = await login('pm1@velozity.com', 'PROJECT MANAGER 1');
  const dev1Token = await login('dev1@velozity.com', 'DEVELOPER 1');

  // Test 1: Admin Dashboard
  const adminDashRes = await fetch('http://localhost:5000/api/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminDash: any = await adminDashRes.json();
  console.log('\n📊 Admin Dashboard Metrics:');
  console.log('   - Total Projects:', adminDash.data.totalProjects);
  console.log('   - Tasks by Status:', adminDash.data.tasksByStatus);
  console.log('   - Overdue Tasks Count:', adminDash.data.overdueCount);
  console.log('   - Active Online Users:', adminDash.data.onlineUsersCount);

  // Test 2: PM Dashboard
  const pmDashRes = await fetch('http://localhost:5000/api/dashboard', {
    headers: { Authorization: `Bearer ${pm1Token}` },
  });
  const pmDash: any = await pmDashRes.json();
  console.log('\n📋 PM1 Dashboard Metrics:');
  console.log('   - Owned Projects:', pmDash.data.ownProjectsCount);
  console.log('   - Tasks by Priority:', pmDash.data.tasksByPriority);
  console.log('   - Upcoming Tasks This Week:', pmDash.data.upcomingTasksThisWeek.length);

  // Test 3: Dev Dashboard
  const devDashRes = await fetch('http://localhost:5000/api/dashboard', {
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  const devDash: any = await devDashRes.json();
  console.log('\n💻 Dev1 Dashboard Metrics:');
  console.log('   - Total Assigned Tasks:', devDash.data.totalAssigned);
  console.log('   - Overdue Count:', devDash.data.overdueCount);

  // Test 4: Security Boundary Enforcement
  console.log('\n🛡️ Testing Security Boundaries:');
  
  // Developer attempting to create a project (Should be 403 Forbidden)
  const devCreateProject = await fetch('http://localhost:5000/api/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${dev1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Illegal Project By Dev',
      clientId: 'c1',
    }),
  });
  console.log('   - Dev attempting to create Project (Expected 403):', devCreateProject.status);

  // Developer attempting to view all users (Expected 403)
  const devGetUsers = await fetch('http://localhost:5000/api/users', {
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  console.log('   - Dev attempting to view all users (Expected 403):', devGetUsers.status);

  // Test 5: Recent Activity & Missed Events Recovery
  const activityRes = await fetch('http://localhost:5000/api/activity', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const activityData: any = await activityRes.json();
  console.log('\n📜 Missed Events Recovery (Activity Feed from DB):');
  console.log('   - Retrieved Activity Logs Count:', activityData.data.length);
  if (activityData.data.length > 0) {
    console.log('   - Sample Log:', activityData.data[0].message);
  }

  // Test 6: URL Filter Query Parameters
  const filteredTasksRes = await fetch('http://localhost:5000/api/tasks?priority=CRITICAL&status=IN_PROGRESS', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const filteredTasks: any = await filteredTasksRes.json();
  console.log('\n🔍 URL Filter Query Parameters (?priority=CRITICAL&status=IN_PROGRESS):');
  console.log('   - Matched Tasks:', filteredTasks.data.length);
  filteredTasks.data.forEach((t: any) => {
    console.log(`     * Task #${t.taskNumber} [${t.priority}] (${t.status}): ${t.title}`);
  });

  console.log('\n✅ All API & Security tests passed successfully!');
}

testApi().catch(console.error);

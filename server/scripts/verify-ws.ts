import WebSocket from 'ws';

async function testWebSocket() {
  console.log('⚡ Starting WebSocket & Real-Time Feed Verification...\n');

  // 1. Login Admin and Developer
  const adminRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@velozity.com', password: 'Password123!' }),
  });
  const adminJson: any = await adminRes.json();
  const adminToken = adminJson.data.accessToken;

  const devRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev1@velozity.com', password: 'Password123!' }),
  });
  const devJson: any = await devRes.json();
  const devToken = devJson.data.accessToken;

  // 2. Connect Admin WebSocket
  const adminWs = new WebSocket(`ws://localhost:5000/ws?token=${adminToken}`);

  let receivedPresence = false;
  let receivedActivityEvent = false;

  await new Promise<void>((resolve, reject) => {
    adminWs.on('open', () => {
      console.log('✅ Admin WebSocket connected successfully');
    });

    adminWs.on('message', (data: string) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'CONNECTED') {
        console.log('📡 Admin received CONNECTED handshake. Online users:', msg.data.onlineUsersCount);
      }
      if (msg.type === 'PRESENCE_UPDATE') {
        console.log('👥 Admin received live PRESENCE_UPDATE:', msg.data.onlineUsersCount, 'users online');
        receivedPresence = true;
      }
      if (msg.type === 'ACTIVITY_FEED_UPDATE') {
        console.log('🔔 Admin received real-time ACTIVITY_FEED_UPDATE:');
        console.log('   ->', msg.data.message);
        receivedActivityEvent = true;
      }
    });

    // 3. Connect Dev WebSocket after 500ms
    setTimeout(() => {
      const devWs = new WebSocket(`ws://localhost:5000/ws?token=${devToken}`);
      devWs.on('open', async () => {
        console.log('✅ Developer WebSocket connected successfully');

        // 4. Developer updates a task status via API
        // First get developer's assigned tasks
        const devTasksRes = await fetch('http://localhost:5000/api/tasks', {
          headers: { Authorization: `Bearer ${devToken}` },
        });
        const devTasks: any = await devTasksRes.json();
        const taskToUpdate = devTasks.data[0];

        console.log(`\n🔄 Updating status of Task #${taskToUpdate.taskNumber} to IN_REVIEW...`);
        const updateRes = await fetch(`http://localhost:5000/api/tasks/${taskToUpdate.id}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${devToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'IN_REVIEW' }),
        });
        const updateJson = await updateRes.json();
        console.log('   Status update API response:', updateJson.success ? 'SUCCESS' : 'FAILED');

        // Wait 1.5s for WebSocket broadcasts
        setTimeout(() => {
          devWs.close();
          adminWs.close();
          resolve();
        }, 1500);
      });
    }, 500);
  });

  console.log('\n🎯 WebSocket Test Results:');
  console.log('   - Live Presence Received:', receivedPresence ? 'YES' : 'NO');
  console.log('   - Live Activity Feed Received:', receivedActivityEvent ? 'YES' : 'NO');

  if (receivedPresence && receivedActivityEvent) {
    console.log('\n🎉 Real-time WebSockets verified 100% working!');
  } else {
    throw new Error('WebSocket verification did not receive all events');
  }
}

testWebSocket().catch(console.error);

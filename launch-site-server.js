/**
 * ConstructTrack Local Site Network & Desktop Launcher
 * Automatically detects local Wi-Fi / LAN IP, starts backend & frontend,
 * and launches the app in a standalone native desktop window.
 */

const os = require('os');
const { spawn, exec } = require('child_process');
const path = require('path');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Look for non-internal IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prioritize Wi-Fi or Ethernet
        const isWiFi = name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless') || name.toLowerCase().includes('wlan');
        const isEthernet = name.toLowerCase().includes('ethernet') || name.toLowerCase().includes('eth');
        
        candidates.push({
          name,
          address: iface.address,
          priority: isWiFi ? 1 : (isEthernet ? 2 : 3)
        });
      }
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates.length > 0 ? candidates[0].address : 'localhost';
}

const localIp = getLocalIpAddress();
const PORT_FRONTEND = 3000;
const PORT_BACKEND = 5000;

console.log('\n================================================================');
console.log('   🏗️   CONSTRUCTTRACK ENTERPRISE - LOCAL SITE NETWORK HUB');
console.log('================================================================\n');
console.log('🚀 Starting Backend Express Engine (Port 5000)...');
console.log('⚡ Starting Frontend Turbopack Server (Port 3000)...\n');

// 1. Start Backend
const backendProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit'
});

// 2. Start Frontend with 0.0.0.0 host binding for LAN devices
const frontendProcess = spawn('npm', ['run', 'dev', '--', '-H', '0.0.0.0', '-p', String(PORT_FRONTEND)], {
  cwd: path.join(__dirname, 'frontend'),
  shell: true,
  stdio: 'inherit'
});

// 3. Print Local Network Summary after a short delay
setTimeout(() => {
  console.log('\n================================================================');
  console.log('   🎉 CONSTRUCTTRACK IS LIVE ACROSS YOUR LOCAL SITE NETWORK!');
  console.log('================================================================\n');
  console.log(`   🖥️  This PC (Desktop UI):   http://localhost:${PORT_FRONTEND}`);
  console.log(`   📱  Team Mobile / Wi-Fi:    http://${localIp}:${PORT_FRONTEND}`);
  console.log(`   ⚡  Direct Backend API:     http://${localIp}:${PORT_BACKEND}\n`);
  console.log('   💡 TIP: Share the Mobile/Wi-Fi URL with engineers on your site Wi-Fi!');
  console.log('   💡 TIP: In Chrome/Edge, click the "Install App" button in the URL bar');
  console.log('           to pin ConstructTrack to your Windows Taskbar.\n');
  console.log('================================================================\n');

  // 4. Automatically open desktop window for local user
  const targetUrl = `http://localhost:${PORT_FRONTEND}`;
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Try opening as Chrome/Edge App Window (no browser URL bar, looks like native desktop app)
    const chromeCmd = `start chrome --app="${targetUrl}"`;
    const edgeCmd = `start msedge --app="${targetUrl}"`;
    
    exec(chromeCmd, (err) => {
      if (err) {
        exec(edgeCmd, (err2) => {
          if (err2) {
            exec(`start ${targetUrl}`);
          }
        });
      }
    });
  } else {
    exec(`open "${targetUrl}"`);
  }
}, 3000);

// Graceful cleanup on Ctrl+C
function cleanup() {
  console.log('\n🛑 Shutting down ConstructTrack Site Hub...');
  try { backendProcess.kill(); } catch (_) {}
  try { frontendProcess.kill(); } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

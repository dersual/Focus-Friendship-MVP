// client/e2e/penalty.test.js
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

describe('Penalty for leaving page', () => {
  let browser;
  let page;
  let clientProcess;
  let serverProcess;

  beforeAll(async () => {
    // Start the client (webpack-dev-server)
    clientProcess = spawn('npm', ['start'], { cwd: path.resolve(__dirname, '../'), shell: true });
    clientProcess.stdout.on('data', (data) => console.log(`Client: ${data}`));
    clientProcess.stderr.on('data', (data) => console.error(`Client Error: ${data}`));

    // Start the server
    serverProcess = spawn('npm', ['start'], { cwd: path.resolve(__dirname, '../../server'), shell: true });
    serverProcess.stdout.on('data', (data) => console.log(`Server: ${data}`));
    serverProcess.stderr.on('data', (data) => console.error(`Server Error: ${data}`));

    // Wait for client and server to be ready
    await new Promise(resolve => setTimeout(resolve, 10000)); // Give processes time to start

    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto('http://localhost:8080'); // Assuming client runs on 8080
  }, 30000); // Increase timeout for beforeAll

  afterAll(async () => {
    await browser.close();
    if (clientProcess) clientProcess.kill();
    if (serverProcess) serverProcess.kill();
  });

  test('should apply penalty if user leaves page during active session', async () => {
    // Ensure penalties are enabled (default is true, but good to be explicit)
    await page.evaluate(() => {
      localStorage.setItem('ffm:user', JSON.stringify({ xp: 100, level: 1, penaltiesEnabled: true }));
    });
    await page.reload(); // Reload to apply localStorage change

    // Start a timer
    await page.click('button[aria-label="Start Timer"]');
    await page.waitForTimeout(2000); // Let timer run for a bit

    // Simulate page hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        get: function() { return 'hidden'; }
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Wait for grace period + penalty application (8 seconds grace + some buffer)
    await page.waitForTimeout(9000);

    // Simulate page visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        get: function() { return 'visible'; }
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Check if XP was reduced
    const userState = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('ffm:user'));
    });

    expect(userState.xp).toBeLessThan(100); // Initial XP was 100, should be less after penalty
    expect(userState.xp).toBe(90); // Default penalty is 10 XP
  }, 20000); // Increase test timeout
});

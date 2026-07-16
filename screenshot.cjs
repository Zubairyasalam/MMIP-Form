const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Inject mock data into localStorage by visiting the page first
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userId', 'usr-admin');
    localStorage.setItem('userName', 'Admin User');
    localStorage.setItem('userEmail', 'admin@mcc.edu.in');
    
    // Create form for User A
    localStorage.setItem('customForms_usr-A', JSON.stringify([{
      id: 'form-A', name: 'Science Dept Feedback', status: 'Active', creator_id: 'usr-A', creator: 'User A', created: '2026-07-16', questions: []
    }]));
    
    // Create form for User B
    localStorage.setItem('customForms_usr-B', JSON.stringify([{
      id: 'form-B', name: 'Library Registration', status: 'Active', creator_id: 'usr-B', creator: 'User B', created: '2026-07-16', questions: []
    }]));
  });

  // 1. Admin Dashboard View
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000)); // wait for animations
  await page.screenshot({ path: 'C:/Users/DELL/.gemini/antigravity-ide/brain/ea117755-f0c9-4858-b934-f8b58433c8f7/admin_view.png', fullPage: true });

  // 2. User A Dashboard View
  await page.evaluate(() => {
    localStorage.setItem('userRole', 'user');
    localStorage.setItem('userId', 'usr-A');
    localStorage.setItem('userName', 'User A');
  });
  await page.goto('http://localhost:5173/templates', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:/Users/DELL/.gemini/antigravity-ide/brain/ea117755-f0c9-4858-b934-f8b58433c8f7/user_a_view.png', fullPage: true });

  await browser.close();
  console.log('Screenshots captured!');
})();

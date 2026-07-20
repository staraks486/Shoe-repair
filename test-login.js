import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('response', response => console.log('RESPONSE:', response.url(), response.status()));
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('After load URL:', page.url());
  
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'artisan_cobbler_pass');
  
  await page.click('button[type="submit"]');
  
  // Wait a bit to see what happens
  await new Promise(r => setTimeout(r, 2000));
  
  const url = page.url();
  console.log('Current URL:', url);
  
  // Take screenshot
  await page.screenshot({ path: 'screenshot.png' });
  
  const html = await page.content();
  console.log('HTML snippet:', html.substring(0, 500));
  
  await browser.close();
})();

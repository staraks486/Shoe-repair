import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'artisan_cobbler_pass');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ path: 'screenshot3.png' });
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Body Text Snippet:', text.substring(0, 500));
  
  await browser.close();
})();

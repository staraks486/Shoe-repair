import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  await page.goto('http://localhost:3000/login');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'artisan_cobbler_pass');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 5000));
  
  const url = page.url();
  console.log('Current URL after login:', url);
  
  const html = await page.content();
  console.log('Contains Dashboard:', html.includes('Dashboard'));
  console.log('Contains Error:', html.includes('Error'));
  console.log('Contains CW Care:', html.includes('CW Care'));
  
  await browser.close();
})();

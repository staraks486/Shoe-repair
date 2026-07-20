import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'artisan_cobbler_pass');
  
  await page.click('button[type="submit"]');
  
  // Wait a bit to see what happens
  await new Promise(r => setTimeout(r, 2000));
  
  const url = page.url();
  console.log('Current URL after login:', url);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  const html = await page.content();
  const containsDashboard = html.includes('Dashboard');
  const containsCobbler = html.includes('Cobbler Desk');
  
  console.log('Contains Dashboard:', containsDashboard);
  console.log('Contains Cobbler Desk:', containsCobbler);
  
  await browser.close();
})();

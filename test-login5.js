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
  
  await new Promise(r => setTimeout(r, 5000)); // wait longer
  
  const url = page.url();
  console.log('Current URL after login:', url);
  
  // read localstorage
  const state = await page.evaluate(() => {
    return localStorage.getItem('cobbler-storage');
  });
  console.log('App Store State user object:', state ? JSON.parse(state).state.user : null);
  console.log('App Store State userProfile object:', state ? JSON.parse(state).state.userProfile : null);
  
  await browser.close();
})();

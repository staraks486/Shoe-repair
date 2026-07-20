import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 5000));
  
  await page.screenshot({ path: 'screenshot4.png' });
  const html = await page.content();
  console.log(html.substring(0, 1000));
  console.log("-----");
  console.log(await page.evaluate(() => document.body.innerText));
  
  await browser.close();
})();

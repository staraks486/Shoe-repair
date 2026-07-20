import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  console.log("HTML length:", html.length);
  console.log(html.substring(html.indexOf('<body'), html.indexOf('<body') + 200));
  console.log("-----");
  console.log(await page.evaluate(() => document.body.innerText));
  
  await browser.close();
})();

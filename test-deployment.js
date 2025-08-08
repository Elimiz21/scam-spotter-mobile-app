const puppeteer = require('puppeteer');

async function testDeployment() {
  console.log('Testing ScamShield deployment...');
  
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });
    
    // Go to the page
    await page.goto('https://scamshield-full.vercel.app/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Check if root has content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.length : 0;
    });
    
    // Check for any visible text
    const pageText = await page.evaluate(() => document.body.innerText);
    
    console.log('Root content length:', rootContent);
    console.log('Page text preview:', pageText.substring(0, 200));
    
    if (rootContent > 100) {
      console.log('✅ App appears to be rendering!');
    } else {
      console.log('❌ App is not rendering properly');
    }
    
    await browser.close();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDeployment();
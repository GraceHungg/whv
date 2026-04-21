import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.post('/api/analyze', async (req, res) => {
  const { urls } = req.body;
  if (!urls || urls.length === 0) {
    return res.status(400).json({ error: 'No URLs provided' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set in .env file' });
  }

  try {
    console.log(`[API] Start analyzing ${urls.length} urls`);
    let combinedContent = '';

    // 1. Scrape all URLs
    const browser = await puppeteer.launch({ 
      headless: "new",
      // 如果是在 Render 雲端環境上，就不強制綁定本機的 chrome，讓它用雲端下載的版本
      channel: process.env.NODE_ENV === 'production' ? undefined : "chrome",
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    for (const url of urls) {
      console.log(`[API] Scraping ${url}...`);
      const page = await browser.newPage();
      try {
        // 偽裝成正常瀏覽器，避免被 Threads 擋下
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // 滾動一下頁面，觸發 Threads 的動態載入
        await page.evaluate(() => window.scrollBy(0, 1000));
        await new Promise(r => setTimeout(r, 5000)); // 等待留言渲染
        await page.evaluate(() => window.scrollBy(0, 2000));
        await new Promise(r => setTimeout(r, 3000));
        
        const content = await page.evaluate(() => document.body.innerText);
        console.log(`[API] Successfully scraped ${url}. Content length: ${content.length}`);
        console.log(`[API] Content preview: ${content.substring(0, 150).replace(/\n/g, ' ')}...`);
        
        combinedContent += `\n\n--- Content from ${url} ---\n\n${content}`;
      } catch (err) {
        console.error(`[API] Error scraping ${url}:`, err.message);
      } finally {
        await page.close();
      }
    }
    await browser.close();

    console.log(`[API] Scraping complete. Text length: ${combinedContent.length}. Calling LLM...`);

    // 2. Call Gemini API
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
你是一個打工度假分析引擎。請分析以下抓取到的網頁內容（可能包含 Threads/Dcard 的主文與所有底下網友留言）。

任務：
1. 提取出主觀論點、薪資、房租、優缺點等打工度假資訊。
2. 【衝突觀點處理】：如果你發現網友對同一件事有「相反的觀點」（例如有人說好找工作，有人說極難找），請不要只偏袒一方。請將兩方觀點分別列入 pros (優點) 與 cons (缺點) 中對比，或在 summary 總結中特別註明「此為因人而異的爭議點」。自動過濾掉純粹情緒性且無具體事實的謾罵。
3. 找出提到的「所有國家」。如果內容主要在討論某個國家，請把它加入分析清單。即使該國家原本不在名單上（例如：日本、韓國等），也請你動態新增這個類別。
4. 如果內文抓取不完整（只有短句），也請盡力針對該短句進行推測並產生資料。
5. 嚴格回傳符合以下 JSON 格式的資料，不要有任何其他多餘字元或 markdown code block：

{
  "analyzedData": {
    "國家名稱(例如: 日本)": {
      "flag": "🇯🇵(對應國旗emoji)",
      "score": 85,
      "pros": ["提取出的優點1"],
      "cons": ["提取出的缺點1"],
      "summary": "AI 根據這批留言產生的總結評論（約50字內）",
      "articles": [
        {
          "title": "請務必根據討論內容生出一個標題",
          "excerpt": "這串討論主要的核心論點",
          "commentCount": 15,
          "url": "一定要附上討論串原始網址"
        }
      ]
    }
  }
}

以下是被抓取的內容：
${combinedContent.substring(0, 15000)}
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    // 移除可能存在的 markdown code block
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // 3. Return JSON
    const data = JSON.parse(responseText);
    console.log(`[API] Analysis complete. Detected countries:`, Object.keys(data.analyzedData || {}));
    
    res.json(data);
  } catch (error) {
    console.error('[API] Analysis failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

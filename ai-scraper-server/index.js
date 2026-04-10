const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Le port est 5001 car le serveur principal occupe déjà le port 5000.
// Deux serveurs ne peuvent pas écouter sur le même port simultanément.
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialisation de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Scraping statique avec Axios et Cheerio
 */
async function scrapeStatic(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        
        // On récupère le texte principal pour l'IA
        const title = $('title').text();
        const body = $('body').text().replace(/\s\s+/g, ' ').substring(0, 10000); // Limiter la taille pour Gemini
        
        return { title, content: body, method: 'static' };
    } catch (error) {
        console.error('Static scraping error:', error.message);
        throw error;
    }
}

/**
 * Scraping dynamique avec Puppeteer
 */
async function scrapeDynamic(url) {
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        // Empêcher les navigations non désirées après le chargement initial
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Attendre que le réseau soit stable
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        
        // Attendre un peu plus pour être sûr que les scripts ont fini
        await new Promise(resolve => setTimeout(resolve, 2000));

        const content = await page.evaluate(() => {
            return {
                title: document.title,
                body: document.body ? document.body.innerText.replace(/\s\s+/g, ' ').substring(0, 10000) : ''
            };
        });
        
        return { title: content.title, content: content.body, method: 'dynamic' };
    } catch (error) {
        console.error('Dynamic scraping error:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Analyse avec Gemini
 */
async function analyzeWithGemini(scrapedData) {
    try {
        // Utilisation de gemini-1.5-flash (plus stable et rapide)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            Tu es un expert en extraction de données. Voici le contenu brut d'une page web :
            Titre: ${scrapedData.title}
            Contenu: ${scrapedData.content}
            
            Analyse ce contenu et extrais les informations suivantes sous format JSON :
            - Nom de l'entreprise 
            - Description courte
            - Catégorie suggérée
        
            
            Réponds uniquement avec le JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Nettoyage de la réponse pour extraire le JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse JSON", raw: text };
    } catch (error) {
        console.error('Gemini error:', error.message);
        return { error: "Gemini analysis failed", details: error.message };
    }
}

// Endpoint principal
app.post('/api/scrape', async (req, res) => {
    const { url, dynamic = false } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        let data;
        if (dynamic) {
            data = await scrapeDynamic(url);
        } else {
            try {
                data = await scrapeStatic(url);
            } catch (e) {
                console.log('Static failed, trying dynamic...');
                data = await scrapeDynamic(url);
            }
        }

        const analysis = await analyzeWithGemini(data);
        
        res.json({
            success: true,
            metadata: {
                url,
                method: data.method,
                title: data.title
            },
            data: analysis
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('AI Scraper Server is running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

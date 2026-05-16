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
 * Helper pour exécuter une requête Gemini avec gestion du Quota (Retry automatique si 429)
 */
async function runGeminiWithRetry(model, prompt, retries = 2, delay = 10000) {
    for (let i = 0; i <= retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result;
        } catch (error) {
            const isRetryableError = 
                error.message.includes('429') || 
                error.message.includes('Quota exceeded') ||
                error.message.includes('503') || 
                error.message.includes('Service Unavailable') ||
                error.message.includes('500') ||
                error.message.includes('Internal Server Error');

            if (isRetryableError && i < retries) {
                
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw error;
        }
    }
}

/**
 * Scraping statique avec Axios et Cheerio
 */
async function scrapeStatic(url) {
    try {
        const https = require('https');
        const agent = new https.Agent({ rejectUnauthorized: false }); // Ignore les SSL expirés

        const { data } = await axios.get(url, {
            httpsAgent: agent,
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
            ignoreHTTPSErrors: true, // Ignore les SSL expirés
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
            // Extraire les liens mailto pour aider l'IA
            const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'))
                .map(a => a.href.replace('mailto:', '').split('?')[0]);
            
            return {
                title: document.title,
                body: (document.body ? document.body.innerText : '') + "\n\nEMAILS DETECTES: " + mailtoLinks.join(', '),
                method: 'dynamic'
            };
        });
        
        return { title: content.title, content: content.body, method: 'dynamic' };
    } catch (error) {
       
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Vérifie si une URL est accessible ET contient un email potentiel
 */
async function validateUrlAndEmail(url) {
    try {
        const https = require('https');
        const agent = new https.Agent({ rejectUnauthorized: false });
        
        // Timeout de 10s comme demandé par l'utilisateur
        const response = await axios.get(url, { 
            httpsAgent: agent,
            timeout: 10000, 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            validateStatus: (status) => status < 400
        });

        const bodyText = response.data;
        if (typeof bodyText !== 'string') return false;

        // Regex pour détecter les emails (global)
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = bodyText.match(emailRegex) || [];

        // Liste de mots-clés à exclure (faux positifs fréquents)
        const blacklist = ['sentry', 'git', 'bootstrap', 'wp', 'noreply', 'example', 'domain.com', 'test', 'your-email', 'png', 'jpg', 'gif', 'svg'];
        
        const validEmails = matches.filter(email => {
            const lower = email.toLowerCase();
            return !blacklist.some(word => lower.includes(word));
        });

        if (validEmails.length === 0) {
            
            return true; // On garde quand même pour l'IA
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Analyse avec Gemini prenant en compte la taxonomie de ProFinder
 */
async function analyzeWithGemini(scrapedData, taxonomyOptions, type = 'company') {
    try {
        // Utilisation de gemini-2.5-flash-lite (plus disponible et rapide que la version standard)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        
        const taxonomyInstruction = (taxonomyOptions && taxonomyOptions.length > 0)
            ? `\nIMPORTANT: Tu DOIS obligatoirement choisir la "Catégorie suggérée" UNIQUEMENT à partir de cette liste exacte : [${taxonomyOptions.join(', ')}]. Copie exactement le texte du service choisi. Si absolument aucune catégorie ne correspond à l'entreprise, renvoie exactement "Sans catégorie". Ne crée pas de nouvelles catégories !`
            : '';

        const isPro = type === 'professional';
        const entityLabel = isPro ? "Nom complet de la personne" : "Nom de l'entreprise";
        const prompt = `
            Tu es un expert en extraction de données. Voici le contenu brut d'une page web :
            Titre: ${scrapedData.title}
            Contenu: ${scrapedData.content}
            
            Analyse ce contenu et extrais les informations suivantes sous format JSON :
            - "${entityLabel}"
            - "Description courte"
            - "Catégorie suggérée"
            - "Email de contact" (Cherche bien dans le texte, les pieds de page ou déduis-le des liens détectés. S'il y a plusieurs emails, choisis le plus générique comme info@ ou contact@. Si vraiment rien n'est trouvable, renvoie 'null').
            - "Téléphone" (Si présent, format international. Sinon 'null').
        
            ${taxonomyInstruction}

            IMPORTANT: Si tu trouves un email sous une forme complexe (ex: contact [at] domaine . com), nettoie-le en format standard.
            Réponds uniquement avec un objet JSON strict et valide. Évite le bloc texte markdown avant ou après.
        `;

        const result = await runGeminiWithRetry(model, prompt);
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
    const { url, dynamic = false, taxonomyOptions = [], type = 'company' } = req.body;
    
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

        const analysis = await analyzeWithGemini(data, taxonomyOptions, type);
        
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
        res.json({ success: false, error: "Impossible d'accéder à ce site web (serveur injoignable ou protégé)." });
    }
});

app.post('/api/search-maps', async (req, res) => {
    const { query, type = 'company' } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-lite",
            tools: [{ googleSearch: {} }]
        });

        const entityName = type === 'professional' ? "professionnels" : "entreprises";
        const prompt = `Trouve les sites web officiels pour cette recherche: "${query}". 
Cherche des vraies ${entityName} qui affichent clairement leurs contacts (email, téléphone).
Évite les portails comme facebook, instagram, linkedin, pagesjaunes, med.tn, youtube, tiktok, ou annuaires.
Renvoie la réponse UNIQUEMENT sous forme d'un tableau JSON valide d'objets, avec ce format exact :
[
  { "name": "Nom de l'entreprise", "url": "https://www.exemple.com" }
]
Ne renvoie STRICTEMENT QUE le JSON (ni markdown \`\`\`json, ni explication). MAXIMUM 20 résultats.`;

        const result = await runGeminiWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();
        
        let uniqueItems = [];
        try {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                uniqueItems = JSON.parse(jsonMatch[0]);
            } else {
                uniqueItems = JSON.parse(text);
            }
        } catch (e) {
            console.error("Erreur de parsing JSON de Gemini Search:", text);
        }

        const unfilteredItems = uniqueItems.map(item => ({
            name: item.name,
            url: item.url
        })).filter(item => item.url && item.url.startsWith('http') && !["facebook", "instagram", "pagesjaunes", "med.tn", "youtube", "linkedin", "tiktok", "bing.com"].some(d => item.url.toLowerCase().includes(d)));

        // Étape de vérification (Accessibilité + Email) en parallèle
        console.log(`[Validation] Vérification de la qualité sur ${unfilteredItems.length} sites...`);
        const results = await Promise.all(unfilteredItems.map(async (item) => {
            const isValid = await validateUrlAndEmail(item.url);
            return isValid ? item : null;
        }));

        const items = results.filter(item => item !== null).slice(0, 10);
        console.log(`[Validation] ${items.length} sites validés et renvoyés.`);

        res.json({ success: true, results: items });

    } catch (error) {
        console.error('Gemini Search error:', error.message);
        res.status(500).json({ success: false, error: "Désolé, impossible d'effectuer la recherche pour le moment." });
    }
});

app.get('/', (req, res) => {
    res.send('AI Scraper Server is running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

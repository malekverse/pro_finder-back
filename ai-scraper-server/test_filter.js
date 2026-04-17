const axios = require('axios');

async function test() {
    try {
        console.log("Triggering a search to test filtering...");
        const res = await axios.post('http://localhost:5001/api/search-maps', {
            query: "Cliniques à Bizerte"
        });
        console.log("Results received:", res.data.results.length);
        res.data.results.forEach(r => console.log(`- ${r.name}: ${r.url}`));
    } catch (e) {
        console.error("Test failed:", e.response?.data || e.message);
        console.log("\nTIP: Make sure your ai-scraper-server is running (npm run dev in the ai-scraper-server folder).");
    }
}

test();

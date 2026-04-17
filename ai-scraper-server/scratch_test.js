const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const axios = require('axios');

async function main() {
  try {
    const res = await axios.get("https://generativelanguage.googleapis.com/v1beta/models?key=" + process.env.GEMINI_API_KEY);
    console.log(res.data.models.map(m => m.name).join("\n"));
  } catch(e) {
    console.error("error fetching models:", e.response?.data || e.message);
  }
}

main();

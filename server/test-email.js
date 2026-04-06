require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("--- TEST ENVOI EMAIL ---");
console.log("Email utilisé:", process.env.EMAIL_USER);
console.log("Pass (longueur):", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function test() {
  try {
    console.log("Vérification de la connexion...");
    await transporter.verify();
    console.log("Connexion réussie !");

    console.log("Tentative d'envoi d'email de test à:", process.env.EMAIL_USER);
    await transporter.sendMail({
      from: `"Test ProFinder" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test de connexion ProFinder",
      text: "Si vous recevez cet email, la configuration Nodemailer est correcte !",
    });
    console.log("Email de test envoyé avec succès !");
  } catch (error) {
    console.error("ERREUR DÉTAILLÉE:");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Response:", error.response);
  }
}

test();

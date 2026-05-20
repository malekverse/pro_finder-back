const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: (parseInt(process.env.EMAIL_PORT) === 465), // true pour le port 465, false pour 587 (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Aide souvent en dev local
  }
});

// Vérifier la connexion au démarrage
transporter.verify(function (error, success) {
  if (error) {
    console.log("--- ERREUR CONFIGURATION EMAIL ---");
    console.log("Email utilisé:", process.env.EMAIL_USER);
    console.log("Erreur Nodemailer:", error.message);
    console.log("------------------------------------");
  } else {
    console.log("--- CONFIGURATION EMAIL RÉUSSIE ---");
    console.log("Le serveur d'email est prêt.");
    console.log("------------------------------------");
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email config missing, logging to console instead:");
      console.log(`To: ${to}\nSubject: ${subject}\nBody: ${html}`);
      return;
    }

    const info = await transporter.sendMail({
      from: `"Pro Finder" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("ERREUR ENVOI EMAIL:", error.message);
    if (error.code === 'EAUTH') {
      console.error("Erreur d'authentification : Vérifiez votre EMAIL_USER et EMAIL_PASS. Utilisez un 'Mot de passe d'application' si la 2FA est activée.");
    }
    throw error;
  }
};

const sendStatusEmail = async (companyEmail, companyName, status, reason = "") => {
  let subject = "";
  let body = "";

  const headerStyle = "color: #1E3A5F; font-size: 24px; font-weight: 800; margin-bottom: 20px;";
  const containerStyle = "font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;";
  const footerStyle = "margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;";

  if (status === "active") {
    subject = "Félicitations ! Votre compte Pro Finder a été approuvé";
    body = `
      <div style="${containerStyle}">
        <h1 style="${headerStyle}">Bienvenue sur Pro Finder !</h1>
        <p>Bonjour ${companyName},</p>
        <p>Nous avons le plaisir de vous informer que votre demande d'inscription a été <strong>approuvée</strong> par notre équipe de modération.</p>
        <p>Vous pouvez dès à présent vous connecter à votre espace professionnel pour configurer votre profil, ajouter vos services et produits.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3001'}/auth/login" style="background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Se connecter à mon espace</a>
        </div>
        <div style="${footerStyle}">
          &copy; 2024 Pro Finder. Tous droits réservés.
        </div>
      </div>
    `;
    } else if (status === "blocked") {
    subject = "Notification de suspension de compte - Pro Finder";
    body = `
      <div style="${containerStyle}">
        <h1 style="${headerStyle}">Compte suspendu</h1>
        <p>Bonjour ${companyName},</p>
        <p>Nous vous informons que suite à un ou plusieurs signalements et après examen par notre équipe de modération, nous avons pris la décision de <strong>suspendre votre compte</strong> sur notre plateforme.</p>
        <div style="background: #fff1f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #b91c1c; font-weight: bold;">Motif de la suspension :</p>
          <p style="margin: 5px 0 0; color: #475569;">${reason || "Non spécifié"}</p>
        </div>
        <p>Si vous souhaitez contester cette décision ou obtenir plus d'informations, vous pouvez répondre à cet e-mail.</p>
        <div style="${footerStyle}">
          &copy; 2024 Pro Finder. Tous droits réservés.
        </div>
      </div>
    `;
  } else if (status === "reported") {
    subject = "Signalement concernant votre entreprise sur Pro Finder";
    body = `
      <div style="${containerStyle}">
        <h1 style="${headerStyle}">Information sur un signalement</h1>
        <p>Bonjour ${companyName},</p>
        <p>Nous vous contactons pour vous informer qu'un signalement a été effectué concernant votre entreprise sur notre plateforme.</p>
        <div style="background: #fff1f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #b91c1c; font-weight: bold;">Détails du signalement :</p>
          <p style="margin: 5px 0 0; color: #475569;">${reason || "Non spécifié"}</p>
        </div>
        <p>Veuillez prendre les mesures nécessaires pour résoudre ce problème. Si vous avez des questions, vous pouvez nous contacter.</p>
        <div style="${footerStyle}">
          &copy; 2024 Pro Finder. Tous droits réservés.
        </div>
      </div>
    `;
  } else if (status === "pending") {
    subject = "Votre inscription sur Pro Finder est en cours d'examen";
    body = `
      <div style="${containerStyle}">
        <h1 style="${headerStyle}">Dossier en attente</h1>
        <p>Bonjour ${companyName},</p>
        <p>Nous vous informons que votre dossier est actuellement <strong>en cours d'examen</strong> par notre équipe.</p>
        <p>Nous reviendrons vers vous très prochainement avec une décision finale.</p>
        <div style="${footerStyle}">
          &copy; 2024 Pro Finder. Tous droits réservés.
        </div>
      </div>
    `;
  } else if (status === "manual") {
    subject = "Message de l'équipe Pro Finder";
    body = `
      <div style="${containerStyle}">
        <h1 style="${headerStyle}">Nouveau message</h1>
        <p>Bonjour ${companyName},</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #1e293b; line-height: 1.6;">${reason}</p>
        </div>
        <div style="${footerStyle}">
          &copy; 2024 Pro Finder. Tous droits réservés.
        </div>
      </div>
    `;
  }

  return sendEmail(companyEmail, subject, body);
};

module.exports = {
  sendEmail,
  sendStatusEmail
};

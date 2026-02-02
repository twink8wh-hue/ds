const { db } = require('../lib/firebase');
const Brevo = require('@getbrevo/brevo');

let apiInstance = new Brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send();

  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Сохраняем код в Firestore (база данных)
    await db.collection('otps').doc(email).set({
      code: code,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 минут
    });

    // Настройка письма
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Your Quire Login Code";
    sendSmtpEmail.htmlContent = `<html><body><h1>Code: ${code}</h1></body></html>`;
    sendSmtpEmail.sender = { "name": "Quire", "email": process.env.BREVO_SENDER };
    sendSmtpEmail.to = [{ "email": email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

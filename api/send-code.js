const { db } = require('../lib/firebase');
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 1. Сохраняем в Firebase
    await db.collection('otps').doc(email).set({
      code: code,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    // 2. Отправляем через EmailJS с использованием Private Key
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY, // ЭТО РЕШИТ ПРОБЛЕМУ
      template_params: {
        to_email: email,
        passcode: code
      }
    });

    res.status(200).json({ success: true });

  } catch (error) {
    const errorDetail = error.response ? error.response.data : error.message;
    console.error("SERVER_ERROR_DETAIL:", errorDetail);
    res.status(500).json({ error: errorDetail });
  }
};

const { db } = require('../lib/firebase');
const axios = require('axios');

module.exports = async (req, res) => {
  // Настройка CORS
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Генерируем 6-значный код
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 1. Сохраняем в базу (Firestore)
    await db.collection('otps').doc(email).set({
      code: code,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 минут жизни в базе
    });

    // 2. Отправляем в EmailJS
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,       // Получатель
        passcode: code,        // Переменная {{passcode}}
      }
    });

    console.log(`Log: Code ${code} sent to ${email}`);
    res.status(200).json({ success: true });

  } catch (error) {
    console.error("SERVER_ERROR:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to send verification code" });
  }
};

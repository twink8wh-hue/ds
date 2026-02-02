const { db } = require('../lib/firebase');
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send();
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await db.collection('otps').doc(email).set({ code, expiresAt: Date.now() + 5 * 60 * 1000 });

    // Запрос к API EmailJS
    await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        code: code
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("EMAILJS_ERROR:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to send via EmailJS" });
  }
};

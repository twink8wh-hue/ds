const { db, auth } = require('../lib/firebase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;

  try {
    const docRef = db.collection('otps').doc(email);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(400).json({ error: "Code not found" });

    const data = doc.data();
    if (Date.now() > data.expiresAt) return res.status(400).json({ error: "Code expired" });
    if (data.code !== code) return res.status(400).json({ error: "Invalid code" });

    await docRef.delete();

    let uid;
    try {
      const user = await auth.getUserByEmail(email);
      uid = user.uid;
    } catch (e) {
      const newUser = await auth.createUser({ email, emailVerified: true });
      uid = newUser.uid;
    }

    const token = await auth.createCustomToken(uid);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

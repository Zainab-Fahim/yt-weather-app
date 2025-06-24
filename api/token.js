export default async function handler(req, res) {
    const auth = Buffer.from(
      process.env.CLIENT_KEY + ':' + process.env.CLIENT_SECRET
    ).toString('base64');
  
    const tokenRes = await fetch(process.env.TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
  
    if (!tokenRes.ok) {
      return res.status(500).send(await tokenRes.text());
    }
    res.json(await tokenRes.json());
  }
  
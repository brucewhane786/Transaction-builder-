const { Server, Transaction } = require('stellar-sdk');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { xdr } = req.body;

    if (!xdr) {
      return res.status(400).json({ success: false, error: "Missing signed XDR payload" });
    }

    // Direct Pi Mainnet Node Communication Channel
    const server = new Server("https://api.mainnet.minepi.com");

    // Passphrase wrapper matching your bot setup
    const transaction = new Transaction(xdr, "Pi Mainnet");

    // Inject direct transaction to blockchain
    const response = await server.submitTransaction(transaction);

    return res.status(200).json({ success: true, result: response });

  } catch (e) {
    console.error("🔥 Vercel Serverless Exception:", e);
    const resultCodes = e.response?.data?.extras?.result_codes || {};
    const detailedError = e.response?.data?.detail || "Horizon network rejection";

    return res.status(500).json({
      success: false,
      error: e.message,
      reason: resultCodes,
      detail: detailedError
    });
  }
}

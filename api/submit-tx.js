const { Server, Transaction } = require('stellar-sdk');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { xdr } = req.body;

    if (!xdr) {
      return res.status(400).json({ success: false, error: "Missing signed XDR payload" });
    }

    const server = new Server("https://api.mainnet.minepi.com");

    // Standard absolute network definition string
    const transaction = new Transaction(xdr, "Pi Network ;");

    const response = await server.submitTransaction(transaction);

    return res.status(200).json({ success: true, result: response });

  } catch (e) {
    console.error("🔥 Serverless core endpoint failure:", e);
    const resultCodes = e.response?.data?.extras?.result_codes || "Unknown";
    const detailError = e.response?.data?.detail || e.message;

    return res.status(200).json({
      success: false,
      error: detailError,
      reason: resultCodes
    });
  }
}

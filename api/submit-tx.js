const { Server, TransactionBuilder, Account, Operation } = require('stellar-sdk');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { xdr } = req.body; // Frontend can still send, but we build dynamically to ensure fresh sequence

    // 1. Establish absolute connection to Pi Mainnet Endpoint
    const server = new Server("https://api.mainnet.minepi.com");

    // 2. HARDCODED WALLET MAPS (Using keys directly from your live screenshot input)
    const sourceWallet = "GAA7P57XKVXNDOULYIBZYRW4IXWOQVPXA7GTZX4LGDH2VPS24NSOZGGH"; // Main Account
    const backupWallet = "GCPGGSFWZP7RD4NSM6TCR2OG4CRLIDNHAIWXHW6ORRQD5YG2EC7AYMEI"; // Backup Signer Account
    const secretSeed   = "SCUJRT774H55T4DBSDZIU2TAGI6GYAUPFUXZ6IKX445C5R4NIXMIF2RA"; // Main Private Seed

    // 🛠️ CRITICAL UPGRADE: Live Account Data Fetch to bypass sequence errors
    const accountResponse = await server.loadAccount(sourceWallet);
    
    // Auto-derive next valid sequence directly from Pi Ledger Runtime
    const nextSequence = accountResponse.sequenceNumber(); 

    const account = new Account(sourceWallet, nextSequence);

    // 3. Rebuild fresh transaction envelope with exact synced parameters
    const transaction = new TransactionBuilder(account, {
        fee: "15000", // High priority fee to force block inclusion instantly
        networkPassphrase: "Pi Network ;"
    })
    .addOperation(Operation.setOptions({
        masterWeight: 1,
        lowThreshold: 1,
        medThreshold: 2,
        highThreshold: 2,
        signer: {
            ed25519PublicKey: backupWallet,
            weight: 1
        }
    }))
    .setTimeout(180)
    .build();

    // 4. Cryptographic local server-side signing
    const sourceKeypair = require('stellar-sdk').Keypair.fromSecret(secretSeed);
    transaction.sign(sourceKeypair);

    // 5. Inject fresh validated XDR onto live blockchain ledger
    const response = await server.submitTransaction(transaction);

    return res.status(200).json({ success: true, result: response });

  } catch (e) {
    console.error("🔥 Re-Submission Glitch Caught:", e);
    const resultCodes = e.response?.data?.extras?.result_codes || "Stellar Exception Engine";
    const detailedError = e.response?.data?.detail || e.message;

    return res.status(200).json({
      success: false,
      error: detailedError,
      reason: resultCodes
    });
  }
}

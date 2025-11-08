// This is a secure way to send notifications via Telegram bot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

async function sendTelegramMessage(message) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, type, userId, amount } = req.body;

    // Format the message based on notification type
    let formattedMessage = '🔔 <b>TopMint Notification</b>\n\n';
    
    switch (type) {
      case 'investment':
        formattedMessage += `💰 New Investment\n`;
        break;
      case 'withdrawal':
        formattedMessage += `💸 Withdrawal Request\n`;
        break;
      case 'bonus':
        formattedMessage += `🎁 Bonus Added\n`;
        break;
      default:
        formattedMessage += `ℹ️ Update\n`;
    }

    formattedMessage += `\n${message}\n`;
    if (userId) formattedMessage += `\nUser ID: ${userId}`;
    if (amount) formattedMessage += `\nAmount: $${amount.toLocaleString()}`;
    formattedMessage += `\nTime: ${new Date().toLocaleString()}`;

    await sendTelegramMessage(formattedMessage);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
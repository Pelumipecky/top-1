export async function sendNotification({ message, type, userId, amount }) {
    try {
        const response = await fetch('/api/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                type,
                userId,
                amount
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to send notification:', error);
        throw error;
    }
}
export const notifyRegistration = async (type: 'kurumsal' | 'kullanıcı', name: string, email: string) => {
  try {
    await fetch('/api/notify-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, name, email }),
    });
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
  }
};

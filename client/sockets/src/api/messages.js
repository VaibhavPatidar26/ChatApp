import axios from "./axios";

// ---------------- GET CHAT MESSAGES ----------------
export async function getUserChats(receiverId) {
  try {
    const res = await axios.get(`/api/messages/userchats/${receiverId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching chats:", err);
    throw err.response?.data || { message: "Server error", success: false };
  }
}

// ---------------- DELETE MESSAGE ----------------
export async function deleteMessage(messageId) {
  try {
    const res = await axios.patch(`/api/messages/deletechats/${messageId}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting message:", err);
    throw err.response?.data || { message: "Server error", success: false };
  }
}

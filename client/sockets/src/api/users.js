import axios from "./axios";

// ---------------- GET ALL CONTACTS ----------------
export async function getUsers() {
  try {
    const res = await axios.get("/api/users/contacts");
    return res.data; // only data object
  } catch (err) {
    console.error("Error fetching users:", err);
    throw err.response?.data || { message: "Server error", success: false };
  }
}

// ---------------- SEARCH USER BY EMAIL ----------------
export async function searchUsers(email) {
  try {
    const res = await axios.get("/api/users/searchusers", { params: { email } });
    return res.data;
  } catch (err) {
    console.error("Error searching user:", err);
    throw err.response?.data || { message: "Server error", success: false };
  }
}

import axios from "axios";

export const uploadFile = (backendurl, token, receiverId) => {
  const upload_file = async (file) => {
    if (!file) {
      alert("No file selected");
      return null;
    }

    try {
      const formdata = new FormData();
      formdata.append("file", file);
      formdata.append("receiverId", receiverId); // ✅ ADDED: Backend needs this

      // ✅ CHANGED: Route from /send to /send-file
      const { data } = await axios.post(
        `${backendurl}/api/messages/send-file`,
        formdata,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!data.success) {
        alert("File not uploaded");
        return null;
      }

      // ✅ CHANGED: Return the full data object, not just URL
      return {
        fileUrl: data.data.fileUrl,
        fileType: data.data.fileType,
        id: data.data.id,
        createdAt: data.data.createdAt,
      };
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.message || "File upload failed");
      return null;
    }
  };

  return { upload_file };
};
import axios from "axios";


export const uploadFile = (backendurl, token) => {

  const upload_file = async (file) => {
    if (!file) {
      alert("No file selected");
      return null;
    }

    try {
      const formdata = new FormData();
      formdata.append("my_file", file);

      const { data } = await axios.post(
        backendurl + "api/fileupload",
        formdata,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!data.url) {
        alert("File not uploaded");
        return null;
      }

      return data.url;
    } catch (err) {
      console.error("Upload failed:", err);
      alert("File upload failed");
      return null;
    }
  };

  return { upload_file };
};

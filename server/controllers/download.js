import axios from "axios";

/**
 * Force file download from a remote URL (Cloudinary or any)
 */
export const forceDownload = async (req, res) => {
  try {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).json({ message: "File URL is required" });
    }

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename || "file"}"`
    );

    res.setHeader(
      "Content-Type",
      response.headers["content-type"]
    );

    response.data.pipe(res);
  } catch (error) {
    console.error("Download error:", error.message);
    res.status(500).json({ message: "File download failed" });
  }
};

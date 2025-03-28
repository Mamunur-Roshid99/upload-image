import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadProgress(0);
    setError(null);

    axios
      .post("https://uploadimageapi.vercel.app/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      })
      .then((res) => {
        setUploadedFile(res.data.file);
        setFile(null);
        setPreview(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Error uploading file!");
        console.error("Upload error:", err);
      });
  };

  return (
    <div className="App">
      <h1>File Upload System</h1>

      <div className="upload-container">
        <input type="file" onChange={handleFileChange} accept="image/*" />

        {preview && (
          <div className="preview">
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: "300px", maxHeight: "300px" }}
            />
            <p>
              {file.name} - {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        <button onClick={handleUpload} disabled={!file}>
          Upload File
        </button>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="progress-bar">
            <div style={{ width: `${uploadProgress}%` }}>{uploadProgress}%</div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {uploadedFile && (
          <div className="upload-success">
            <h3>Upload Successful!</h3>
            <p>
              File URL:{" "}
              <a
                href={uploadedFile.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {uploadedFile.url}
              </a>
            </p>
            <img
              src={uploadedFile.url}
              alt="Uploaded content"
              style={{ maxWidth: "300px", maxHeight: "300px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

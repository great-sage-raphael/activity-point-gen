const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const port = 4000;


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); 
  },
});

const upload = multer({ storage });


app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const imagePath = req.file.path;

  
  const pythonProcess = spawn("python3", ["certificate_verify.py", imagePath]);

  let result = "";
  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python script error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "Python script failed" });
    }

    
    res.json({ result });
  });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// Ensure the downloads directory exists
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

// Route to handle video download
app.post('/download', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const downloadPath = path.join(downloadDir, 'video.mp4');

  // yt-dlp command: Fetch best video + audio and merge into MP4
  const command = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 -o "${downloadPath}" ${url}`;

  console.log(`Executing command: ${command}`);
  
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Download Error:', stderr);
      return res.status(500).send('Failed to download video.');
    }

    console.log('Download Completed:', stdout);

    // Verify if the file exists and its size
    if (fs.existsSync(downloadPath)) {
      const stats = fs.statSync(downloadPath);

      if (stats.size > 1024) { // Ensure file size is larger than 1 KB
        console.log('File downloaded successfully:', downloadPath);

        // Send the file to the client
        res.download(downloadPath, 'video.mp4', (err) => {
          if (err) {
            console.error('Error sending file:', err);
            return res.status(500).send('Failed to send video file.');
          }

          // Optionally delete the file after sending
          fs.unlink(downloadPath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            else console.log('File deleted after download');
          });
        });
      } else {
        console.error('Downloaded file is too small, likely an error occurred.');
        return res.status(500).send('Downloaded file is invalid or incomplete.');
      }
    } else {
      console.error('Download failed: File not found.');
      return res.status(500).send('Download failed.');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

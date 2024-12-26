const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to handle downloading content with quality selection
app.post('/download', (req, res) => {
  const { url, quality } = req.body;

  if (!url || !quality) {
    return res.status(400).json({ error: 'URL and quality are required' });
  }

  // Define the download path for the video
  const downloadPath = path.join(__dirname, 'downloads', 'video.mp4');

  // Ensure download directory exists
  if (!fs.existsSync(path.dirname(downloadPath))) {
    fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
  }

  // Prepare the yt-dlp command to download the video with selected quality
  let command = `yt-dlp -f ${quality} -o "${downloadPath}" ${url}`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error during download:', stderr);
      return res.status(500).send('Failed to download video.');
    }

    if (stderr) {
      console.error('stderr:', stderr);
      return res.status(500).send('Failed to download video.');
    }

    console.log('Video downloaded:', stdout);

    // After the video is downloaded, merge audio and video (if needed)
    if (stdout.includes("audio only")) {
      let mergeCommand = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 -o "${downloadPath}" ${url}`;

      exec(mergeCommand, (mergeErr, mergeStdout, mergeStderr) => {
        if (mergeErr) {
          console.error('Error during merge:', mergeStderr);
          return res.status(500).send('Failed to merge video and audio.');
        }

        console.log('Merge output:', mergeStdout);

        // Send the video file to the client as a download
        res.download(downloadPath, 'video.mp4', (downloadErr) => {
          if (downloadErr) {
            console.error('Error sending file:', downloadErr);
            return res.status(500).send('Failed to send video file.');
          }

          // Optionally, remove the file after it's sent to avoid storage issues
          fs.unlink(downloadPath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            else console.log('File deleted after download');
          });
        });
      });
    } else {
      // Send the video file directly if it's already merged
      res.download(downloadPath, 'video.mp4', (downloadErr) => {
        if (downloadErr) {
          console.error('Error sending file:', downloadErr);
          return res.status(500).send('Failed to send video file.');
        }

        // Optionally, remove the file after it's sent to avoid storage issues
        fs.unlink(downloadPath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
          else console.log('File deleted after download');
        });
      });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

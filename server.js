const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Example route to download content with quality selection
app.post('/download', (req, res) => {
  const { url, quality } = req.body; // Receive URL and quality option from the client

  // Validate input
  if (!url || !quality) {
    return res.status(400).json({ error: 'URL and quality are required' });
  }

  // Prepare yt-dlp command based on selected quality
  let command = `yt-dlp -f ${quality} ${url}`; 

  // Run the yt-dlp command
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Error during download', message: stderr });
    }
    res.status(200).json({ message: 'Download successful', output: stdout });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

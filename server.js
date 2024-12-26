const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (e.g., HTML, CSS, JS)

// Route to serve the index.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to get video formats (quality options)
app.post('/get-formats', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // yt-dlp command to get video formats
  const command = `yt-dlp -F ${url}`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Error fetching formats', message: stderr });
    }
    const formats = stdout
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('Format code'))
      .map(line => {
        const parts = line.trim().split(/\s{2,}/);
        return { code: parts[0], description: parts.slice(1).join(' ') };
      });
    res.status(200).json({ formats });
  });
});

// Route to handle downloading content with quality selection
app.post('/download', (req, res) => {
  const { url, quality } = req.body;

  if (!url || !quality) {
    return res.status(400).json({ error: 'URL and quality are required' });
  }

  let command = `yt-dlp -f ${quality} ${url}`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Error during download', message: stderr });
    }
    res.status(200).json({ message: 'Download successful', output: stdout });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

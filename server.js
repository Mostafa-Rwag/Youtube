const express = require('express');
const { exec } = require('child_process');
const path = require('path');  // For serving static files
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle downloading content with quality selection
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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

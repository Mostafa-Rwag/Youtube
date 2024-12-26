const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route to stream and download the video
app.post('/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // yt-dlp command to stream the video
    const ytDlp = spawn('yt-dlp', ['-f', 'best[ext=mp4]', '-o', '-', url]);

    // Set response headers to force download
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
    res.setHeader('Content-Type', 'video/mp4');

    ytDlp.stdout.pipe(res); // Stream video directly to client

    ytDlp.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ytDlp.on('error', (error) => {
        console.error('Error spawning yt-dlp:', error);
        res.status(500).send('Error downloading video.');
    });

    ytDlp.on('close', (code) => {
        if (code !== 0) {
            console.error(`yt-dlp process exited with code ${code}`);
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

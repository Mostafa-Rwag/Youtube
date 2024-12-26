const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve the HTML page from the server
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Video Downloader</title>
    </head>
    <body>
        <h1>YouTube Video Downloader</h1>
        <form id="downloadForm">
            <label for="url">YouTube Video URL:</label><br>
            <input type="text" id="url" name="url" required><br><br>
            <button type="submit">Download Video</button>
        </form>

        <script>
            document.getElementById('downloadForm').addEventListener('submit', (event) => {
                event.preventDefault();

                const url = document.getElementById('url').value;
                if (!url) {
                    alert('Please enter a URL.');
                    return;
                }

                fetch('/download', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.blob();
                })
                .then((blob) => {
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = 'video.mp4';
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                    a.remove();
                })
                .catch((error) => {
                    console.error('Error:', error);
                    alert('Failed to download the video.');
                });
            });
        </script>
    </body>
    </html>
    `);
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

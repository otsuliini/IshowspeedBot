const { spawn } = require('child_process');

const ffmpeg = spawn('ffmpeg', ['-i', 'test.mp3', '-f', 'wav', 'pipe:1']);

ffmpeg.stdout.on('data', data => console.log('stdout:', data.toString()));
ffmpeg.stderr.on('data', data => console.log('stderr:', data.toString()));
ffmpeg.on('close', code => console.log(`FFmpeg exited with code ${code}`));
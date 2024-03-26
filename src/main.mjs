import * as  functions from '@google-cloud/functions-framework';
import * as https from 'https';
import { OfflineCompiler } from './image-target/offline-compiler.js';

import { loadImage } from 'canvas';
functions.http('helloHttp', (req, res) => {
    let imgUrl = req.query.img
    https.get(imgUrl, (response) => {
        const chunks = [];
      
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
      
        response.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            const compiler = new OfflineCompiler();
            const images = await loadImage(buffer)
            await compiler.compileImageTargets([images], console.log);
            const featureBuffer = compiler.exportData();
            console.log('Feature buffer:', featureBuffer);
            const filename = 'target.mind';

            // Set headers
            res.set('Content-Disposition', `attachment; filename="${filename}"`);
            res.set('Content-Length', featureBuffer.length);
            res.send(featureBuffer);
        });
      }).on('error', (err) => {
        console.error('Error fetching image:', err);
      });
});

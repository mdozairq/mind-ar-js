import * as  functions from '@google-cloud/functions-framework';
import * as https from 'https';
import { OfflineCompiler } from './image-target/offline-compiler.js';
import { loadImage } from 'canvas';
const { Storage } = require('@google-cloud/storage');

async function uploadToGCS(file_location, bucket_name, upload_prefix, final_output_name) {
  return new Promise(async (resolve, reject) => {
      //console.log("Uploading", bucket_name, upload_prefix, final_output_name);
      const storage = new Storage();

      const bucket = storage.bucket(bucket_name);

      try {
          const destinationPath = `${upload_prefix}`

          await bucket.upload(file_location, {
              destination: destinationPath,
          });

          const fileUploadedUrl = `https://storage.googleapis.com/${bucket_name}/${destinationPath}`;
          resolve(fileUploadedUrl);
      } catch (err) {
          console.error('Error uploading image to GCS:', err);
          reject(err);
      }
  })
}


functions.http('helloHttp', async (req, res) => {
    let imgUrl = req.query.img
    let objectId = req.query.id
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
            const filename = `${objectId}.mind`;

            // Set headers
            // res.set('Content-Disposition', `attachment; filename="${filename}"`);
            // res.set('Content-Length', featureBuffer.length);
            // res.send(featureBuffer);
        });
      }).on('error', (err) => {
        console.error('Error fetching image:', err);
      });

      let mindFileUrl = await uploadToGCS()

});

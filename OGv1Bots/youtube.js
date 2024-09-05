const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');

// initialize the Youtube API library
// const youtube = google.youtube('v3');


const uploadToYoutube = async (oauthClient, fileName)  => {
  const youtube = oauthClient.youtube('v3');
  // Obtain user credentials to use for the request
  //   const auth = await authenticate({
  //     // need to put oauth stuff here
  //     scopes: [
  //       'https://www.googleapis.com/auth/youtube.upload',
  //       'https://www.googleapis.com/auth/youtube',
  //     ],
  //   });
  //   google.options({auth});

  const fileSize = fs.statSync(fileName).size;
  const res = await youtube.videos.insert(
    {
      part: 'id,snippet,status',
      notifySubscribers: false,
      requestBody: {
        snippet: {
          title: 'Node.js YouTube Upload Test',
          description: 'Testing YouTube upload via Google APIs Node.js Client',
        },
        status: {
          privacyStatus: 'private',
        },
      },
      media: {
        body: fs.createReadStream(fileName),
      },
    },
    {
      // Use the `onUploadProgress` event from Axios to track the
      // number of bytes uploaded to this point.
      onUploadProgress: evt => {
        const progress = (evt.bytesRead / fileSize) * 100;
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0, null);
        process.stdout.write(`${Math.round(progress)}% complete`);
      },
    }
  );
  console.log('\n\n');
  console.log(res.data);
  return res.data;
};

// uploadToYoutube('someFile')

module.exports = uploadToYoutube;
const { exec } = require('child_process');
const { getVideoDurationInSeconds } = require('get-video-duration');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const getMp3Duration = require('get-mp3-duration');
const concat = require('ffmpeg-concat');
const {deleteFilesInDirectory, getFileName, seeIfFileExists, getMP3FileName} = require('../utils');
ffmpeg.setFfmpegPath(ffmpegPath);

const stackVideos = async () => {
  // this will stack videos vertically
  ffmpeg()
    .input('videos/2.MOV')
    .input('videos/ai2.mp4')
    .complexFilter([
      '[0:v]scale=300:300[0scaled]',
      '[1:v]scale=300:300[1scaled]',
      '[0scaled]pad=600:300[0padded]',
      '[0padded][1scaled]overlay=shortest=1:x=300[output]'
    ])
    .outputOptions([
      '-map [output]'
    ])
    .output('output.mp4')
    .on('error',function (er){
      console.log('error occured: '+er.message);
    })
    .on('end',function (){
      console.log('success');
    })
    .run();
};

// TODO update aspect ratio
const cutVideoToUnder60s = async (videoPath) => {
  const videoName = getMP3FileName(videoPath);
  const outputPath = `../resources/shorts/${videoName}.mp4`;
  console.log(outputPath);
  ffmpeg(videoPath)
    .setStartTime('00:00:00')
    .setDuration(55)
    .outputOptions('-vf', 'scale=ih*9/16:ih')
    .output(outputPath)
    .on('end', function (err) {
      if (!err) { console.log('Video cut and aspect ratio set'); }
    })
    .on('error', err => console.log('Error: ', err))
    .run();

  return outputPath;
};

const getAudioDuration = (relativePath) => {
  const audioPath = relativePath;
  const rawAudio = fs.readFileSync(audioPath);
  const durationInMs = getMp3Duration(rawAudio);
  const durationInSeconds = Math.round(durationInMs / 1000);
  return durationInSeconds;
};

const getVideoDuration = async (videoPath) => {
  const path = videoPath;
  const duration = await getVideoDurationInSeconds(path);
  const durationInSeconds = Math.round(duration);
  // console.log(durationInSeconds)
  return durationInSeconds;
};

const selectRandomVideo = () => {
  const videosFolder = path.join(__dirname, '../resources/videos'); 

  // Read the contents of the folder
  const videoFiles = fs.readdirSync(videosFolder);

  // Check if there are any video files in the folder
  if (videoFiles.length === 0) {
    console.error('No video files found in the "videos" folder.');
    return null;
  }

  // Randomly select a video file
  const randomIndex = Math.floor(Math.random() * videoFiles.length);
  const randomVideo = videoFiles[randomIndex];

  // Return the full path of the randomly selected video
  const fullPath = path.join(videosFolder, randomVideo);
  const relativePath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
  return relativePath;
};

const reencodeVideo = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-movflags', '+faststart')  // Move moov atom to the start of the file
      .output(outputPath)
      .on('end', function () {
        console.log('Re-encoding completed and moov atom fixed');
        resolve(outputPath);
      })
      .on('error', function (err) {
        console.error('Error during re-encoding:', err);
        reject(err);
      })
      .run();
  });
};

// Function to cut the video with a random start time
const cutVideoWithRandomStart = async (videoPath) => {
  // Get video name
  const videoName = getMP3FileName(videoPath);
  
  // Generate random start time between 30 and 90 seconds
  const randomStartTime = Math.floor(Math.random() * (90 - 30 + 1)) + 30;
  console.log(`Random start time: ${randomStartTime} seconds`);

  // Define the output path for the trimmed video
  const outputPath = `../resources/offsetStartVideos/${videoName}.mp4`;
  console.log(`Output path: ${outputPath}`);

  // Ensure the output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Re-encode the video to ensure moov atom is placed correctly
  // const reencodedPath = `../resources/offsetStartVideos/reencoded_${videoName}.mp4`;
  // await reencodeVideo(videoPath, reencodedPath);

  // Run ffmpeg to trim the video with the random start time and same duration
  ffmpeg(videoPath)
    .setStartTime(randomStartTime)  // Set random start time
    // .outputOptions('-vf', 'scale=ih*9/16:ih')  // Optional scaling filter
    .output(outputPath)
    .on('end', function () {
      console.log('Video trimmed with random start time');
    })
    .on('error', err => {
      console.error('FFmpeg error:', err);  // Log detailed error information
    })
    .run();

  // Return the output path after the video is cut
  return outputPath;
};



const getCombinedVideoPaths = async (relativePathAudio) => {
  const audioPath = relativePathAudio;
  const arrayOfVideoPaths = [];

  // get length of audio
  const audioDuration = getAudioDuration(audioPath);

  // get first video
  const firstVideoPath = selectRandomVideo();
  const durationOfFirstVideo = await getVideoDuration(firstVideoPath);
  arrayOfVideoPaths.push(firstVideoPath);
  let totalVideoDuration = durationOfFirstVideo;
    
  // if first video is shorter than audio, grab path for another video
  while (audioDuration > totalVideoDuration) {
    const anotherVideoPath = selectRandomVideo();
    const durationOfVideo = await getVideoDuration(anotherVideoPath);
    totalVideoDuration = totalVideoDuration + durationOfVideo;
    arrayOfVideoPaths.push(anotherVideoPath);
  }

  return arrayOfVideoPaths;
};


const combineVideosForTempVideo = async (audioPath) => {
  const path = require('path');
  const fs = require('fs');
  const concat = require('ffmpeg-concat'); // Ensure this package is installed

  // Resolve the absolute path for the audio file
  const audioPathForVideo = path.resolve(audioPath);

  // Get the list of video paths
  const videoPaths = await getCombinedVideoPaths(audioPathForVideo);

  // Extract the audio name to construct the output path
  const audioName = getMP3FileName(audioPathForVideo);

  // Resolve the absolute output path
  const outputDir = path.resolve(
    '../resources/tempVideos'
  );
  const outputPath = path.join(outputDir, `${audioName}.mp4`);

  console.log('Resolved Output Path:', outputPath);

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Check if all video paths exist
  for (const videoPath of videoPaths) {
    const resolvedVideoPath = path.resolve(videoPath);
    if (!fs.existsSync(resolvedVideoPath)) {
      console.error(`Video path does not exist: ${resolvedVideoPath}`);
      return;
    }
  }

  // Ensure the audio file exists
  if (!fs.existsSync(audioPathForVideo)) {
    console.error(`Audio path does not exist: ${audioPathForVideo}`);
    return;
  }

  try {
    await concat({
      output: outputPath,
      videos: videoPaths.map((video) => path.resolve(video)), // Resolve video paths
      audio: audioPathForVideo, // Absolute path for audio
      frameFormat: 'png', // Adjust if needed
    });
    console.log('Temp video complete:', outputPath);
  } catch (error) {
    console.error('Error while combining videos:', error.message);
    console.log('Details:', error.cmd);
  }

  return outputPath;
};


// has 16:9 aspect ratio
const cutVideoToFinalLength = async (relativePath, relativePathAudio) => {
  // Resolve file paths
  const videoPath = path.resolve(relativePath);
  const audioPath = path.resolve(relativePathAudio);
  const finalVideoName = getMP3FileName(audioPath) + '.mp4';
  const audioDuration = getAudioDuration(audioPath);
  const finalDuration = audioDuration + 3;
  const finalVideoPath = `../resources/finalVideos/${finalVideoName}`;

  // Replace slashes for Windows compatibility
  const formattedVideoPath = replaceForwardSlash(videoPath);
  const formattedFinalVideoPath = replaceForwardSlash(finalVideoPath);

  // Video filter for 16:9 TikTok aspect ratio
  const videoFilter = `"scale=w=1080:h=1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"`;

  // Construct the ffmpeg command
  const ffmpegCommand = `ffmpeg -i ${formattedVideoPath} -vf ${videoFilter} -t ${finalDuration} -y ${formattedFinalVideoPath}`;
  
  // Execute the ffmpeg command
  return new Promise((resolve, reject) => {
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      if (stderr) {
        console.error(`ffmpeg stderr: ${stderr}`);
      }
      resolve(finalVideoPath);
    });
  });
};


const replaceForwardSlash = (inputString) => {
  return inputString.replace(/\//g, '\\\\');
};

// working no adjustments
const mixAudio = async (music, voice, outputFileName) => {
  const output = `..\\resources\\mixedAudio\\${outputFileName}.mp3`;

  // Ensure paths are correct and formatted well
  const formatVoice = replaceForwardSlash(voice);
  console.log('format voice: ' + formatVoice);

  // Adjust the ffmpeg command for better mixing
  const ffmpegCommand = `ffmpeg -i ${formatVoice} -i ${music} -filter_complex "[1:a]volume=0.40[a1];[0:a][a1]amix=inputs=2:duration=longest:dropout_transition=1" ${output}`;

  // Execute the ffmpeg command
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`ffmpeg stderr: ${stderr}`);
      return;
    }
    console.log('Audio Mixed...');
  });

  return output;
};


// loop and pitch adjustment
// const mixAudio = async (music, voice, outputFileName) => {
//   const output = `..\\resources\\mixedAudio\\${outputFileName}.mp3`;

//   // Resolve paths and format the voice input for Windows compatibility
//   const formatVoice = replaceForwardSlash(voice);
//   const formatMusic = replaceForwardSlash(music);
//   console.log('Format voice: ' + formatVoice);
//   console.log('Format music: ' + formatMusic);

//   // Construct FFmpeg command with pitch adjustment and background music looping
//   const ffmpegCommand = `
//     ffmpeg -i ${formatVoice} -i ${formatMusic} -filter_complex 
//     "[1:a]aloop=loop=-1:size=44100,asetrate=48000*1.05,aresample=48000,volume=0.40[bg]; 
//      [0:a][bg]amix=inputs=2:duration=first:dropout_transition=1" -y ${output}
//   `.replace(/\s+/g, ' ').trim(); // Remove extra spaces/newlines for cleaner command

//   // Execute the FFmpeg command
//   return new Promise((resolve, reject) => {
//     exec(ffmpegCommand, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Error: ${error.message}`);
//         return reject(error);
//       }
//       if (stderr) {
//         console.error(`FFmpeg stderr: ${stderr}`);
//       }
//       console.log('Audio Mixed with Pitch Adjustment...');
//       resolve(output);
//     });
//   });
// };



// this will loop music
// const mixAudio = async (music, voice, outputFileName) => {
//   const output = `..\\resources\\mixedAudio\\${outputFileName}.mp3`;

//   // Resolve paths and format the voice input for Windows compatibility
//   const formatVoice = replaceForwardSlash(voice);
//   const formatMusic = replaceForwardSlash(music);
//   console.log('Format voice: ' + formatVoice);
//   console.log('Format music: ' + formatMusic);

//   // Construct FFmpeg command
//   const ffmpegCommand = `ffmpeg -i ${formatVoice} -i ${formatMusic} -filter_complex "[1:a]aloop=loop=-1:size=44100[a1];[a1]volume=0.40[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=1" -y ${output}`;
  
//   // Execute the FFmpeg command
//   return new Promise((resolve, reject) => {
//     exec(ffmpegCommand, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`Error: ${error.message}`);
//         return reject(error);
//       }
//       if (stderr) {
//         console.error(`FFmpeg stderr: ${stderr}`);
//       }
//       console.log('Audio Mixed...');
//       resolve(output);
//     });
//   });
// };




const sleep = async  (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};


const getRandomBackgroundMusic = (folderPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        return reject(`Error reading directory: ${err.message}`);
      }

      // Filter only MP3 files
      const mp3Files = files.filter(file => file.endsWith('.mp3'));
      if (mp3Files.length === 0) {
        return reject('No MP3 files found in the folder.');
      }

      // Select a random file
      const randomFile = mp3Files[Math.floor(Math.random() * mp3Files.length)];
      resolve(path.join(folderPath, randomFile));
    });
  });
};


const createVideoForEachAudioFile = async () => {
  const audioFolder = path.join(__dirname, '../resources/poolPartyAudio'); 
  console.log(audioFolder)
  console.log(audioFolder)
  // Read the contents of the folder
  const audioFiles = fs.readdirSync(audioFolder);

  // Check if there are any video files in the folder
  if (audioFiles.length === 0) {
    console.error('No audio files found in the "poolPartyAudioudio" folder.');
    return null;
  }

  for (audioFile of audioFiles) {
    // get path of each file
    const fullPath = path.join(audioFolder, audioFile);
    const relativePath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
    console.log(relativePath);

    
    // TODO here I want to create the mixed audio
    const backgroundMusicFolder = '../resources/backgroundMusic';
    const audioFileName = getFileName(relativePath);

    const pathToBackgroundMusic = await getRandomBackgroundMusic(backgroundMusicFolder);
    console.log('path to background music ###########################################')
    console.log(pathToBackgroundMusic)
    const mixedAudioPath = await mixAudio(pathToBackgroundMusic , relativePath, audioFileName);
        
    console.log('gonna wait before making video');
    await sleep(12000);
        
    console.log('Creating video...');
    // create video for each file
    // relative path is audio path
    const videoOutputPath =  await combineVideosForTempVideo(mixedAudioPath);
    console.log('done')
    const finalVideoPath = await cutVideoToFinalLength(videoOutputPath, mixedAudioPath);
    console.log(finalVideoPath)
    console.log('final video path ^^')
    let fileExists = false;
    console.log('Waiting for final file to be finished...');
    do {
      fileExists = await seeIfFileExists(finalVideoPath);
      if (fileExists) {
        console.log('file exists!');
      }
    } while (!fileExists);

   
  }
  console.log('Deleting temporary files...');
  await deleteFilesInDirectory('./resources/tempVideo');
  await deleteFilesInDirectory('./resources/mixedAudio')
};


createVideoForEachAudioFile()


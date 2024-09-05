const { exec } = require('child_process');
const { getVideoDurationInSeconds } = require('get-video-duration');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const getMp3Duration = require('get-mp3-duration');
const concat = require('ffmpeg-concat');
const {deleteFilesInDirectory, getFileName, seeIfFileExists, deleteTempFiles, getMP3FileName} = require('../utils');
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
  const outputPath = `shorts/${videoName}.mp4`;
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
  const videosFolder = path.join(__dirname, 'videos'); 

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
  const audioPathForVideo = audioPath;
  const videoPaths = await getCombinedVideoPaths(audioPathForVideo);
   
  const audioName = getMP3FileName(audioPathForVideo);
  const outputPath = `tempVideos/${audioName}.mp4`;
  console.log(outputPath);
  console.log('putting the temp video with audio here ^^');
  try {
    await concat({
      output: outputPath,
      videos: videoPaths,
      audio: audioPathForVideo,
      frameFormat: 'png'
    });
  } catch (error) {
    console.log('damn');
    console.log(error);
  }
    
  console.log('temp video complete');
  return outputPath;
};


const cutVideoToFinalLength = async (relativePath, relativePathAudio) => {
  console.log('cutting video to final length...');
  const videoPath = relativePath;
  const audioPath = relativePathAudio;
  const finalVideoName = getMP3FileName(audioPath) + '.mp4';
  const audioDuration = getAudioDuration(audioPath);
  const finalDuration = audioDuration + 3;
  const finalVideoPath = `finalVideos/${finalVideoName}`;
    
  ffmpeg(videoPath)
    .setDuration(finalDuration)
    .output(finalVideoPath)
    .on('end', function (err) {
      if(!err) { console.log('conversion Done'); }
    })
    .on('error', err => console.log('error: ', err))
    .run();


  console.log('final video complete');
  return finalVideoPath;
};

// delete extra long videos, use max of 3 minutes
const isAudioTooLong = async (audioPath) => {
  const durationInSeconds = getAudioDuration(audioPath);
  if (durationInSeconds > 180) {
    console.log('Audio is longer than 3 minutes');
    return true;
  } else {
    return false;
  }
};
const replaceForwardSlash = (inputString) => {
  return inputString.replace(/\//g, '\\\\');
};

const mixAudio = async (music, voice, outputFileName) => {
  output = `mixedAudio\\${outputFileName}.mp3`;
    
  const formatVoice = replaceForwardSlash(voice);
  console.log('format voice: ' + formatVoice);
   
  // total length will be length of first input with 2 second dropout transition
  const ffmpegCommand = `ffmpeg -i ${formatVoice} -i ${music} -filter_complex "[1:a]volume=0.40[a1];[0:a][a1]amix=inputs=2:duration=first:dropout_transition=1" ${output}`;
   
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
    return output;
  });

  return output;
};



const addSubtitles = async (videoFilePath) => {
  const videoName = getMP3FileName(videoFilePath);
  const inputVideoFilePath = `finalVideos/${videoName}.mp4`;
  console.log('input: ' + inputVideoFilePath);
  // const srtFileName = getMP3FileName(subtitleFilePath)
  const outputOptions = `-vf subtitles=./srtFiles/${videoName}.srt`;
  console.log(outputOptions);
  const outputFileName = `videosWithSubtitles/${videoName}.mp4`;
  console.log(outputFileName);
  ffmpeg(inputVideoFilePath)
    .outputOptions(
      outputOptions
    )
    .on('error', function (err) {
      console.log(err);
    })
    .save(outputFileName)
    .on('end', function () {
      console.log('done');
    });

  return outputFileName;
};


const sleep = async  (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};


const listenForString = (targetString) => {
  return new Promise((resolve, reject) => {
    const timeout = 120000; // Timeout in milliseconds
    let timer;
        
    // Event listener for 'data' event emitted by process.stdout
    process.stdout.on('data', (data) => {
      const consoleOutput = data.toString();
      if (consoleOutput.includes(targetString)) {
        clearInterval(timer); // Stop the timer if the target string is found
        resolve(true);
      }
    });

    // Timer to reject the promise if the target string is not found within the timeout period
    timer = setTimeout(() => {
      process.stdout.removeAllListeners('data'); // Remove the event listener
      reject(new Error(`Timeout: Target string '${targetString}' not found`));
    }, timeout);
  });
};


const listenForWord = (word, callback) => {
  const consoleLog = console.log;
  console.log = (message) => {
    consoleLog.apply(console, arguments);
    if (message.includes(word)) {
      callback(true);
      console.log = consoleLog; // Restore original console.log
    }
  };
};


const createVideoForEachAudioFile = async () => {
  const audioFolder = path.join(__dirname, 'tempAudio'); 

  // Read the contents of the folder
  const audioFiles = fs.readdirSync(audioFolder);

  // Check if there are any video files in the folder
  if (audioFiles.length === 0) {
    console.error('No audio files found in the "tempAudio" folder.');
    return null;
  }

  for (audioFile of audioFiles) {
    // get path of each file
    const fullPath = path.join(audioFolder, audioFile);
    const relativePath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
    console.log(relativePath);

    // TODO need to skip audio and delete audiofile and srt file if its too long
    const tooLong = isAudioTooLong(relativePath);

    // TODO here I want to create the mixed audio
    const audioFileName = getFileName(relativePath);
    const pathToBackgroundMusic = 'backgroundMusic\\snowflake.mp3';
    const mixedAudioPath = await mixAudio(pathToBackgroundMusic , relativePath, audioFileName);
        
    console.log('gonna wait before making video');
    await sleep(60000);
        
    console.log('Creating video...');
    // create video for each file
    // relative path is audio path
    const videoOutputPath =  await combineVideosForTempVideo(mixedAudioPath);
        
    const finalVideoPath = await cutVideoToFinalLength(videoOutputPath, mixedAudioPath);
    let fileExists = false;
    do {
      console.log('Waiting for file to be finished...');
      fileExists = await seeIfFileExists(videoOutputPath);
      if (fileExists) {
        console.log('file exists!');
      }
    } while (!fileExists);

    console.log('sleeping whilst file is built...');
    await sleep(120000);
    console.log('okay its been a minute');
    const videoWithSubtitlePath = await addSubtitles(finalVideoPath);
    console.log('subtitles have been added!!');
    await sleep(120000);

    // Create short version
    console.log('gonna create short version...');
    await sleep(25000);
    await cutVideoToUnder60s(videoWithSubtitlePath);
    await sleep(120000);
  }
  console.log('Deleting temporary files...');
  await deleteTempFiles();
};

module.exports = createVideoForEachAudioFile;


const getMP3Duration = require('get-mp3-duration')
const { getVideoDurationInSeconds } = require('get-video-duration')
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
const getMp3Duration = require('get-mp3-duration')
ffmpeg.setFfmpegPath(ffmpegPath)


const editVideo = async () => {
    ffmpeg()
    .input("videos/2.MOV")
    .input("videos/ai2.mp4")
    .complexFilter([
    '[0:v]scale=300:300[0scaled]',
    '[1:v]scale=300:300[1scaled]',
    '[0scaled]pad=600:300[0padded]',
    '[0padded][1scaled]overlay=shortest=1:x=300[output]'
    ])
    .outputOptions([
    '-map [output]'
    ])
    .output("output.mp4")
    .on("error",function(er){
    console.log("error occured: "+er.message);
    })
    .on("end",function(){
    console.log("success");
    })
    .run();
    // ffmpeg('videos/ai1.mp4')
    //     .setStartTime('00:00:00')
    //     .setDuration(10)
    //     .output('newVideoDude.mp4')
    //     .on('end', function(err) {
    //         if(!err) { console.log('conversion Done') }
    //       })
    //       .on('error', err => console.log('error: ', err))
    //       .run()
}

const getAudioDuration = () => {
    const rawAudio = fs.readFileSync('speech.mp3')
    const durationInMs = getMp3Duration(rawAudio)
    const durationInSeconds = Math.round(durationInMs / 1000)
    return durationInSeconds
}

const getVideoDuration = async () => {
    const duration = await getVideoDurationInSeconds('videos/ai1.mp4')
    const durationInSeconds = Math.round(duration)
    return durationInSeconds
}

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
    console.log(fullPath)
    return fullPath;
}

const combineVideosToFillAudio = () => {

}
selectRandomVideo()
// getVideoDuration()
// getAudioDuration()
// editVideo()
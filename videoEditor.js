const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)


// const editVideo = () => {
    
    ffmpeg('videos/ai1.mp4')
        .setStartTime('00:00:00')
        .setDuration(10)
        .output('newVideoDude.mp4')
        .on('end', function(err) {
            if(!err) { console.log('conversion Done') }
          })
          .on('error', err => console.log('error: ', err))
          .run()
// }

// editVideo()
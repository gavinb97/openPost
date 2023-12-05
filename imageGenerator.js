const createGPTClient = require('./gptClient')


const generateImage = async (prompt, numberOfImages) => {
    const client = await createGPTClient()
    
    if (!prompt) return 'error'
    if (!numberOfImages) return 'error'

    try {
        const response = await client.createImage({
            model: "dall-e-3",
            prompt: prompt,
            n: numberOfImages,
            size: "1024x1024"
        })
        image_url = response.data.data[0].url;
        console.log(image_url)
        return image_url
    } catch (e) {
        console.log(e)
    }
}

const downloadImage = async () => {

}

// generateImage()
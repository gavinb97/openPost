require('dotenv').config()
const { file } = require('googleapis/build/src/apis/file');
const generateImage = require('./imageGenerator')
const fs = require('fs');
const axios = require('axios');
const { createClient, ApiKeyStrategy } = require('@wix/sdk');
const { files } = require('@wix/media');

const publishDraftPost = async (draftPostId) => {
    const apiUrl = `https://www.wixapis.com/blog/v3/draft-posts/${draftPostId}/publish`;
    const authToken = process.env.WIX_KEY;
    const siteID = process.env.WIX_SITE_ID
    const accountID = process.env.WIX_ACCOUNT_ID;
    try {
        const response = await axios.post(apiUrl, {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken,
                'wix-site-id': siteID,
                'wix-account-id': accountID
            }
        });

        console.log('Draft post published successfully:', response.data);

    } catch (error) {
        console.log(error)
        console.error('Error publishing draft post:', error.response ? error.response.data : error.message);
    }
}



const uploadMedia = async (uploadUrl, filename) => {
const wixClient = createClient({
    modules: { files },
    auth: ApiKeyStrategy({
      siteId: process.env.WIX_SITE_ID,
      apiKey: process.env.WIX_KEY
    })
  });

  const response = await wixClient.files.importFile(uploadUrl, {displayName: filename, mediaType: 'IMAGE', mimeType: 'image/png' });

  return response
}



const downloadGPTImage = async (url, filepath) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath)); 
    });
}

const generateFilename = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let filename = '';

    for (let i = 0; i < 5; i++) {
        filename += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    return filename + '.png';
};



const createDraftPost = async (blogTitle, blogArticleText) => {
    const apiUrl = 'https://www.wixapis.com/blog/v3/draft-posts/';
    const authToken = process.env.WIX_KEY;
    const siteID = process.env.WIX_SITE_ID;
    const accountID = process.env.WIX_ACCOUNT_ID;

    const imageUrl = await generateImage(blogTitle)
    const fileName = generateFilename()

    await downloadGPTImage(imageUrl, `gptimages/${fileName}`)

    const uploadResponse = await uploadMedia(imageUrl, fileName)

    const mediaId = uploadResponse.file._id
    const mediaUrl = uploadResponse.file.url

    const richContent = await formatTopicsAndParagraphs(mediaUrl, blogArticleText)

    try {
        const response = await axios.post(apiUrl, {
            draftPost: {
                title: blogTitle,
                memberId: accountID,
                heroImage: {
                    id: mediaId,
                    url: mediaUrl
                },
                media: {
                    displayed: true,
                    custom: true,
                    wixMedia: {
                        image: {
                            id: mediaId,
                            url: mediaUrl
                        }
                    }
                },
                richContent: richContent
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken,
                'wix-site-id': siteID,
                'wix-account-id': accountID
            }
        });

        // console.log('Draft post created successfully:', response.data);
        return response.data.draftPost.id
        // grab the id so we can use it to publish the draft post
    } catch (error) {
        console.log(error)
        console.error('Error creating draft post:', error.response ? error.response.data : error.message);
    }
}

// createDraftPost('blog title', 'some blog article text')

// given a list of subtopic/paragraph objects, extract the topic and use as a heading and place the paragraph under it.
const formatTopicsAndParagraphs = async (imageUrl, blogArticleText) => {
    
    const richContent = {
        "nodes": [
            {
                "type": 'IMAGE',
                "imageData": {
                    "containerData": {},
                    "image": {
                        "src": {
                            "private": false,
                            "url": imageUrl
                        },
                        "width": 1024,
                        "height": 500
                    }
                }
            },
            {
                "type": 'PARAGRAPH',
                "nodes": [
                    {
                    "type": 'TEXT',
                    "textData": {
                        "text": blogArticleText,
                        "decorations": []
                    }
                    }
                ]
            }
        ]
    }

    return richContent
}

// createDraftPost1('Unlocking Weight Management: The Impact of Strategic', 'the contents of the blog hakhah askjfhklasdj flasdjfkljasdklfj kasdljfklasdjfk;lasdjf;k lsda sadf')

module.exports = {createDraftPost, publishDraftPost, formatTopicsAndParagraphs}
require('dotenv').config()
const generateImage = require('./imageGenerator')
const axios = require('axios');

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


const createDraftPost = async (blogTitle, blogArticleText) => {
    const apiUrl = 'https://www.wixapis.com/blog/v3/draft-posts/';
    const authToken = process.env.WIX_KEY;
    const siteID = process.env.WIX_SITE_ID;
    const accountID = process.env.WIX_ACCOUNT_ID;

    const richContent = await formatTopicsAndParagraphs(blogTitle, blogArticleText)

    try {
        const response = await axios.post(apiUrl, {
            draftPost: {
                title: blogTitle,
                memberId: accountID,
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

        console.log('Draft post created successfully:', response.data);
        return response.data.draftPost.id
        // grab the id so we can use it to publish the draft post
    } catch (error) {
        console.log(error)
        console.error('Error creating draft post:', error.response ? error.response.data : error.message);
    }
}

// given a list of subtopic/paragraph objects, extract the topic and use as a heading and place the paragraph under it.
const formatTopicsAndParagraphs = async (articleTitle, blogArticleText) => {
    const imageUrl = await generateImage(articleTitle)
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
require('dotenv').config()
const axios = require('axios');

const createDraftPost = async () => {
    const apiUrl = 'http://www.wixapis.com/blog/v3/draft-posts/';
    const authToken = process.env.WIX_KEY;

    try {
        const response = await axios.post(apiUrl, {
            draftPost: {
                title: 'Places to visit in Europe'
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            }
        });

        console.log('Draft post created successfully:', response.data);
        // grab the id so we can use it to publish the draft post
    } catch (error) {
        console.error('Error creating draft post:', error.response ? error.response.data : error.message);
    }
}

const publishDraftPost = async (draftPostId) => {
    const apiUrl = `https://www.wixapis.com/blog/v3/draft-posts/${draftPostId}/publish`;
    const authToken = process.env.WIX_SITE_ID;

    try {
        const response = await axios.post(apiUrl, {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            }
        });

        console.log('Draft post published successfully:', response.data);
    } catch (error) {
        console.error('Error publishing draft post:', error.response ? error.response.data : error.message);
    }
}

module.exports = {createDraftPost, publishDraftPost}
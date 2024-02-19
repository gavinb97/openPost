require('dotenv').config()
const axios = require('axios');

const createDraftPost = async (blogTitle, blogArticleText) => {
    const apiUrl = 'https://www.wixapis.com/blog/v3/draft-posts/';
    const authToken = process.env.WIX_KEY;
    const siteID = process.env.WIX_SITE_ID;
    const accountID = process.env.WIX_ACCOUNT_ID;
    
    const richContent = {
        "nodes": [
            // {
            //     "type": 'HEADING',
            //     "headingData": {
            //         "level": '2',
            //     },
            //     "nodes": [
            //         {
            //             "type": 'TEXT',
            //             "textData": {
            //                 "text": 'this should be a header i hope',
            //                 "decorations": []
            //             }
            //         }
            //     ]
            // },
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
    // const richContent = formatTopicsAndParagraphs()

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


// given a list of subtopic/paragraph objects, extract the topic and use as a heading and place the paragraph under it.
const formatTopicsAndParagraphs = () => {
    const richContent = {
        "nodes": [
            {
                "type": 'IMAGE',
                "imageData": {
                    "containerData": {},
                    "image": {
                        "src": {
                            "private": false,
                            "url": 'some url'
                        },
                        "width": 400,
                        "height": 500
                    }
                },
                "nodes": [
                    {
                        "type": 'TEXT',
                        "textData": {
                            "text": 'this should be a header i hope',
                            "decorations": []
                        }
                    }
                ]
            },
            {
                "type": 'PARAGRAPH',
                "nodes": [
                    {
                    "type": 'TEXT',
                    "textData": {
                        "text": 'blogArticleText some text in a pararalkajsfkld jklasjlkf jasdl;kj fkl;asdj ;lkfjdaslk;fj lkasdfasdf asdfsadf',
                        "decorations": []
                    }
                    }
                ]
            }
        ]
    }

    return richContent
}

module.exports = {createDraftPost, publishDraftPost, formatTopicsAndParagraphs}
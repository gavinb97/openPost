const { getRedditCommentersPoolParty, sendMessageToUser } = require('./redditOauth');
const { getCredsByUsernameAndHandlePoolParty } = require('../socialauthentication/socialAuthData');

// 1. scrape posters from subreddits, try to get 5000 usernames total
// 2. store users in memory or db (optional), or just call until list is empty
// 3. use different credentials for each call, cycling through the pool
// 4. send messages with a rotating user every minute

const bot = async () => {
    const listOfSubredditsToScrapePosters = ['Tinder', 'dating', 'OkCupid', 'Bumble', 'HingeApp']; // example list
    const usernamesAndHandles = [
        { username: 'poolparty', handle: 'poolpartydating' },
        { username: 'poolparty2', handle: 'poolpartydating2' },
        { username: 'poolparty3', handle: 'poolpartydating3' },
        // Add more if needed
    ];

    // Fetch credentials for all user/handle pairs
    const creds = await Promise.all(
        usernamesAndHandles.map(user =>
            getCredsByUsernameAndHandlePoolParty(user.username, user.handle)
        )
    );

    let usersToMessage = [];

    // Cycle through creds while scraping subreddits
    for (let i = 0; i < listOfSubredditsToScrapePosters.length; i++) {
        const subreddit = listOfSubredditsToScrapePosters[i];

        // Pick a set of creds in a round-robin fashion
        const credsIndex = i % creds.length;
        const currentCreds = creds[credsIndex];

        console.log(`Scraping /r/${subreddit} using account: ${currentCreds.handle}`);

        try {
            const subredditCommenters = await getRedditCommentersPoolParty(
                [subreddit],
                currentCreds.redditTokens.access_token,
                75
            );
            usersToMessage = usersToMessage.concat(subredditCommenters);
        } catch (err) {
            console.error(`Failed to scrape /r/${subreddit}:`, err.message);
        }
    }

    console.log(`Collected ${usersToMessage.length} users to message.`);

    // Now send messages in a loop, one every minute using a rotating account
    let messageIndex = 0;

    const interval = setInterval(async () => {
        if (messageIndex >= usersToMessage.length) {
            console.log('All users messaged.');
            clearInterval(interval);
            return;
        }

        const userToMessage = usersToMessage[messageIndex];
        const credsIndex = messageIndex % creds.length;
        const currentCreds = creds[credsIndex];

        const subject = 'Can you try my dating app plss';
        const message = 'plss plss plss';

        try {
            console.log(`Messaging ${userToMessage} from ${currentCreds.handle}`);
            const response = await sendMessageToUser(
                currentCreds.redditTokens.access_token,
                userToMessage,
                subject,
                message
            );
            console.log(`Message sent to ${userToMessage}`, response);
        } catch (err) {
            console.error(`Failed to message ${userToMessage}:`, err.message);
        }

        messageIndex++;
    }, 60 * 1000); // 1 minute
};

bot();

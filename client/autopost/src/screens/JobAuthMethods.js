


const jobAuthMethods = () => {


    const hasTwitterAuth = (user) => {
        if (user?.creds?.twitterTokens?.access_token) {
            return true
        }
        return false
    }

    const hasRedditAuth = (user) => {
        if (user?.creds?.redditTokens?.access_token) {
            return true
        }
        return false
    }


    return (
        hasTwitterAuth,
        hasRedditAuth
    )
    
}

export default jobAuthMethods
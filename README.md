only-posts.com is a social media automation tool designed to simplify the process of managing social media accounts, helping businesses, content creators, and individuals streamline their social media posting. With AI-powered features, users can create and schedule posts, automate direct messaging, and leverage AI-generated content to engage with audiences, all while saving valuable time. Whether you're managing multiple accounts or automating outreach for marketing or personal branding, this platform offers flexible and robust solutions.

This repository includes the UI and server for only-posts.com, along with a sandbox area for testing and experimenting with new features that are not yet available on the live platform.

Key Features
AI-Powered Post Generation: Leverage large language models (LLMs) to generate creative captions and text for posts on platforms like Twitter, Reddit, TikTok, and YouTube. Enhance engagement without spending time manually creating content.

Social Media Automation: Schedule and automate posts across your social media accounts. Create recurring posting jobs with custom or AI-generated content, including text posts for Twitter and Reddit, as well as media posts with images and videos.

Reddit Automation: For Reddit users, select subreddits and schedule automatic posts or direct messages. You can either define custom posts or let the AI generate them based on prompts. The platform can scrape top posts and commenters to send personalized DMs for outreach and marketing.

Twitter Automation: Automate text-based posts or create tweet jobs with custom or AI-generated content. Streamline your Twitter presence without manual effort.

Direct Messaging for Marketing: Automatically send direct messages to users on Reddit. Specify the number of DMs to send, select target subreddits, and let the platform handle outreach for you, saving you time and effort.

Flexible User Plans: Free users can have up to 5 active post jobs running at a time, while premium users can have unlimited accounts and post jobs. Premium users also have access to more advanced features like unlimited job creation.

Tech Stack
Frontend: React.js for the user interface, offering a responsive and user-friendly experience.
Backend: Node.js API for server-side functionality, interacting with a PostgreSQL database hosted on Amazon RDS.
Task Scheduling: RabbitMQ is used for managing and scheduling tasks. The system leverages a delay plugin to execute posts and other tasks at user-defined times and intervals.
Server: The backend runs on a Linux-based server (Ubuntu) with NGINX for reverse proxying and Cloudflare for frontend traffic management.
CI/CD: GitHub Actions automates the deployment process, triggering updates on the server upon code changes. This includes automatic social media token refreshes and other utility tasks.
Node Version: v18.17.1
npm Version: v9.6.7

Sandbox Area
The OGv1Bots folder contains experimental code that is still in development. This includes integrations and features that are being tested before they are available on the live platform. Notably, there are two major scripts:

articleBuilder.js
This is a cron job that generates blog posts. The current implementation selects a random health/fitness-related topic, uses AI (ChatGPT) to create a detailed article on the topic, and publishes the article to a Wix blog along with an AI-generated header image.

videoPostGenerator.js
This script automates the creation of videos by generating voiceovers and subtitles based on Reddit posts. The steps include:

Fetching long-form text (e.g., stories) from selected subreddits.
Converting the text to speech using OpenAI's text-to-speech API.
Creating subtitles in .srt format from the original text.
Automatically selecting and trimming user-uploaded video content to match the length of the audio.
Combining the video, voiceover, subtitles, and background music into a final video.
Uploading the generated video to social media platforms like Twitter, YouTube, TikTok, and Reddit.
Note: FFMPEG must be installed for the videoPostGenerator script to function properly.

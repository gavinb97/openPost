const createGPTClient = require('./gptClient')
const { Configuration, OpenAIApi } = require("openai");
const { createDraftPost, publishDraftPost, formatTopicsAndParagraphs } = require('./blogPost')
const {sendTweet} = require('./tweet')
const fs = require('fs');
const axios = require('axios');
const { send } = require('process');

const createGPT = async () => {
    return await createGPTClient()
}

const chatGpt = createGPT()

const defaultSystemPrompt = `As an NSCA CSCS with a background in kinesiology, exercise science, and human nutrition, as well as experience working with elite athletes and everyday individuals striving for better health, I possess a unique skill set. I excel in explaining complex topics in simple, understandable ways, making me an effective communicator and educator in the realms of fitness, health, and lifestyle.

My approach involves breaking down intricate concepts into digestible pieces, allowing people to grasp even the most challenging subjects logically. Whether it's discussing the biomechanics of a squat, the intricacies of macronutrient metabolism, or the importance of sleep hygiene, I have a knack for crafting engaging and informative content that resonates with a wide audience.

Furthermore, my expertise extends to copywriting, where I specialize in creating compelling copy that drives engagement and resonates with readers. Whether it's crafting persuasive product descriptions, captivating blog posts, or informative articles, I have the skills to deliver professional and impactful content.

With my background and proficiency in simplifying complex topics, I am well-equipped to contribute valuable insights and content to your application aimed at generating fitness, health, and lifestyle articles. By leveraging my expertise, your application can effectively educate and empower individuals to make informed decisions about their well-being.

Input an article title, and I will generate a minimum of a 5 paragraph article going in-depth on the specified topic, drawing on my expertise and experience in the field of fitness, health, and lifestyle to elaborate and explain details of the topic. I will elaborate on the various subtopics that may be related to the article topic`


const systemPromptForGettingTitle = `As an expert in kinesiology, exercise science, and human nutrition, with a background as an NSCA CSCS, I specialize in simplifying complex topics related to fitness, health, and lifestyle. My experience ranges from working with elite athletes to everyday individuals striving for better health.

My approach involves breaking down intricate concepts into digestible pieces, allowing people to grasp even the most challenging subjects logically. Whether it's discussing biomechanics, macronutrient metabolism, or sleep hygiene, I craft engaging and informative content that resonates with a wide audience.

Furthermore, my expertise extends to copywriting, where I excel in creating compelling content that drives engagement and resonates with readers. From persuasive product descriptions to captivating blog posts, I deliver professional and impactful copy.

Given a specific topic, I can generate a singular string response—an article title—that encapsulates the essence of the subject matter. Provide me with a topic, and I'll craft a title that captures its significance and draws readers in with clarity and intrigue.`


const topicArray = [
"Benefits of High-Intensity Interval Training (HIIT)",
"Nutrition Strategies for Muscle Gain",
"Incorporating Flexibility Training into Your Routine",
"Understanding Macronutrients: Carbohydrates, Proteins, and Fats",
"The Importance of Proper Hydration for Performance",
"Functional Training for Everyday Movement",
"How to Prevent and Manage Exercise-Induced Injuries",
"Optimizing Recovery: Sleep, Nutrition, and Rest Days",
"The Role of Supplements in Fitness and Performance",
"Mindfulness and Stress Management Techniques",
"Building a Home Gym on a Budget",
"The Science Behind Weightlifting: Muscles and Mechanics",
"Improving Athletic Performance with Plyometric Training",
"Understanding Body Composition: Muscle vs. Fat",
"Creating Healthy Habits for Long-Term Success",
"The Benefits of Outdoor Exercise and Nature Therapy",
"Navigating Nutrition Labels and Making Informed Choices",
"Cardiovascular Exercise: Beyond Just Running",
"The Psychology of Motivation and Goal Setting",
"Mastering the Basics: Squats, Deadlifts, and Bench Press",
"Meal Prep and Planning for Busy Lifestyles",
"Injury Rehabilitation and Return to Activity Protocols",
"The Role of Genetics in Fitness and Performance",
"Functional Foods: Nutrient-Dense Choices for Optimal Health",
"Interval Training for Fat Loss and Endurance",
"Mind-Body Connection: Yoga and Meditation",
"Understanding Resting Metabolic Rate and Energy Balance",
"Ergogenic Aids: Supplements for Performance Enhancement",
"Balancing Fitness and Family: Tips for Busy Parents",
"The Science of Stretching: Static vs. Dynamic Techniques",
"Pre- and Post-Workout Nutrition Guidelines",
"Incorporating Resistance Bands for Strength and Stability",
"The Importance of Periodization in Training Programs",
"Hybrid Training: Combining Different Modalities for Results",
"Gut Health and Its Impact on Overall Well-Being",
"Functional Movement Screening for Injury Prevention",
"The Role of Electrolytes in Hydration and Performance",
"Navigating Fitness Plateaus: Strategies for Progress",
"Exercise Prescription for Special Populations",
"The Power of Positive Thinking: Mental Toughness in Training",
"Maximizing Performance Through Proper Warm-Up and Cool Down",
"Understanding Delayed Onset Muscle Soreness (DOMS)",
"Healthy Eating on a Budget: Tips and Tricks",
"Social Support and Accountability in Fitness Journey",
"The Science of Sleep: Optimizing Rest and Recovery",
"Cross-Training for Overall Fitness and Injury Prevention",
"The Role of Hormones in Exercise and Body Composition",
"Core Training Beyond Crunches: Functional Movements",
"Managing Weight During Menopause and Hormonal Changes",
"Adapting Workouts for Travel and Time Constraints",
"Injury Prevention Strategies for Runners and Endurance Athletes",
"Effective Communication with Fitness Professionals",
"Understanding Metabolism: Myths vs. Facts",
"The Benefits of Group Exercise Classes",
"Creating a Positive Body Image and Self-Confidence",
"Supplementing for Vegan and Vegetarian Athletes",
"Training Through Pregnancy: Guidelines and Considerations",
"Sports Nutrition for Peak Performance",
"Circuit Training for Total-Body Conditioning",
"The Role of Mindfulness in Eating Behavior",
"Functional Anatomy: Understanding Joint Actions and Muscles",
"Incorporating Balance and Stability Training into Workouts",
"Postural Assessment and Correction for Improved Performance",
"Nutrient Timing for Optimal Performance and Recovery",
"Debunking Fitness Myths: Separating Fact from Fiction",
"The Importance of Cross-Training for Injury Prevention",
"Strategies for Overcoming Exercise Plateaus",
"Effective Goal Setting for Sustainable Fitness Progress",
"Incorporating Strength Training for Older Adults",
"The Benefits of Resistance Training for Women",
"Navigating Dietary Supplements: Safety and Efficacy",
"Functional Movement Patterns for Everyday Life",
"Training Strategies for Enhancing Endurance",
"The Role of Dopamine and Exercise Addiction",
"Injury Prevention Techniques for Contact Sports",
"The Science of Fat Loss: Calories In vs. Calories Out",
"Nutrition Strategies for Pre- and Post-Competition",
"Hydration Strategies for Hot and Humid Environments",
"Understanding Heart Rate Zones for Effective Cardio",
"The Psychology of Habit Formation and Behavior Change",
"Recovery Techniques for Muscle Soreness and Fatigue",
"Exercise and Mental Health: Managing Stress and Anxiety",
"Functional Training for Older Adults: Maintaining Independence",
"Eating Disorders in Athletes: Detection and Prevention",
"The Benefits of Outdoor Recreation for Physical and Mental Health",
"The Role of Cortisol in Stress and Weight Management",
"Optimizing Performance Through Nutrient Timing",
"Interval Training for Improved VO2 Max and Anaerobic Capacity",
"The Impact of Alcohol Consumption on Fitness and Health",
"Mindful Eating: Cultivating Awareness and Satisfaction",
"Preventing and Managing Overtraining Syndrome",
"The Importance of Proper Footwear for Exercise",
"Understanding Glycemic Index and Blood Sugar Regulation",
"Incorporating Foam Rolling for Recovery and Mobility",
"Navigating Dietary Restrictions While Maintaining Fitness Goals",
"The Benefits of CrossFit and Functional Fitness Training",
"The Role of the Nervous System in Muscle Contraction",
"Healthy Snacking Options for On-the-Go Lifestyles",
"The Science of Thermoregulation: Exercise in Extreme Temperatures",
"Incorporating Mindfulness Practices into Daily Life",
"The Role of Nutrition in Bone Health",
"Injury Prevention Strategies for Weightlifters",
"The Benefits of Resistance Bands for Rehabilitation",
"Understanding Energy Systems: ATP-PC, Glycolytic, and Oxidative",
"Functional Movement Patterns for Injury Prevention",
"The Science of Muscle Hypertrophy: Growth Factors and Mechanisms",
"Ergonomics in the Workplace: Improving Posture and Health",
"Incorporating Kettlebell Training for Full-Body Workouts",
"The Importance of Core Stability for Athletic Performance",
"Nutrition Strategies for Endurance Events: Marathon, Triathlon, etc.",
"The Role of Carbohydrates in Exercise Performance",
"Preventing and Managing Shin Splints",
"Developing Explosive Power: Plyometrics and Olympic Lifts",
"The Benefits of Swimming for Cardiovascular Health",
"Understanding Heart Rate Variability (HRV) and Recovery",
"Mindful Eating for Weight Management and Health",
"The Science of Muscle Memory: Training Adaptations and Retention",
"The Importance of Proper Form and Technique in Exercise",
"Interval Training for Weight Loss and Metabolic Health",
"Injury Rehabilitation Techniques for Runners",
"Nutrition Strategies for Youth Athletes",
"The Benefits of Active Recovery Workouts",
"Incorporating Yoga for Flexibility and Stress Relief",
"Understanding Overtraining Syndrome: Signs and Symptoms",
"The Role of Leucine in Muscle Protein Synthesis",
"Balancing Cardio and Strength Training for Optimal Results",
"The Science of Thermogenesis: Boosting Metabolism",
"The Benefits of Functional Movement Assessments",
"Training Strategies for Obstacle Course Racing (OCR)",
"The Role of Magnesium in Exercise Performance and Recovery",
"The Psychology of Injury Rehabilitation and Return to Sport",
"Developing Speed and Agility for Sports Performance",
"Optimizing Nutrition for Recovery Between Training Sessions",
"The Benefits of Cross-Training for Overall Fitness",
"Incorporating Balance Exercises for Fall Prevention",
"The Science of Muscle Fiber Types: Fast-Twitch vs. Slow-Twitch",
"Understanding DOMS: Causes, Prevention, and Treatment",
"The Role of Myofascial Release in Injury Prevention",
"The Importance of Consistency in Fitness and Nutrition",
"Navigating Sports Drinks and Electrolyte Replacement",
"The Benefits of High-Protein Diets for Muscle Building",
"Incorporating Resistance Training for Older Adults",
"The Psychology of Weight Loss: Mindset and Motivation",
"Understanding EPOC (Excess Post-Exercise Oxygen Consumption)",
"The Role of Omega-3 Fatty Acids in Inflammation and Recovery",
"Hydration Strategies for Cold Weather Exercise",
"Injury Prevention Techniques for CrossFit Athletes",
"The Benefits of Functional Fitness for Daily Life",
"Understanding Heat Illnesses and Prevention Strategies",
"The Role of Creatine Supplementation in Performance",
"The Science of Joint Health and Injury Prevention",
"Incorporating Mobility Drills for Joint Health",
"Optimizing Recovery Nutrition for Muscle Repair",
"The Benefits of Prehabilitation Exercises",
"Understanding the Female Athlete Triad",
"Injury Prevention Techniques for Team Sports",
"The Importance of Periodic Deloading in Training Programs",
"The Benefits of Active Transportation: Walking, Biking, etc.",
"The Science of BCAA (Branched-Chain Amino Acids) Supplementation",
"Incorporating Bodyweight Exercises for Strength and Conditioning",
"Understanding Cortisol: The Stress Hormone and Its Effects",
"The Role of Vitamin D in Bone Health and Immunity",
"The Benefits of Functional Strength Training for Seniors",
"Injury Prevention Strategies for Cyclists",
"The Science of Neuromuscular Adaptations to Training",
"The Importance of Proper Breathing Techniques During Exercise",
"Understanding Heat Acclimatization for Athletes",
"Incorporating Meditation for Stress Reduction and Mental Clarity",
"The Benefits of Circuit Training for Fat Loss",
"Nutrition Strategies for Vegetarian and Vegan Athletes",
"The Role of Sleep in Athletic Performance and Recovery",
"Injury Prevention Techniques for Martial Arts Practitioners",
"The Science of High-Intensity Weight Training",
"Understanding the Glycemic Load of Foods",
"The Benefits of Foam Rolling for Recovery and Flexibility",
"Incorporating Functional Training for Golfers",
"The Role of Antioxidants in Exercise Recovery",
"Understanding Training Adaptations: SAID Principle",
"The Benefits of Pilates for Core Strength and Stability",
"Injury Prevention Techniques for Rock Climbers",
"The Science of Blood Flow Restriction Training",
"The Importance of Warm-Up and Cool-Down Protocols",
"Understanding Hyponatremia: Causes and Prevention",
"Incorporating Mindful Movement Practices for Well-Being",
"The Benefits of Interval Training for Cardiorespiratory Fitness",
"Nutrition Strategies for Powerlifting Competitions",
"The Role of Inflammation in Exercise Recovery",
"Injury Prevention Techniques for Tennis Players",
"The Science of VO2 Max and Its Relationship to Endurance",
"The Benefits of Barefoot Training for Foot Strength and Mobility",
"Understanding Protein Synthesis and Muscle Repair",
"Incorporating Agility Drills for Sports Performance",
"The Role of Carbohydrate Loading for Endurance Events",
"The Benefits of Outdoor CrossFit Workouts",
"Understanding Metabolic Conditioning for Fat Loss",
"Injury Prevention Techniques for Hikers",
"The Science of Blood Sugar Regulation During Exercise",
"The Importance of Proper Nutrition for Injury Recovery",
"Incorporating Dynamic Stretching for Warm-Up",
"The Benefits of Active Travel: Exploring on Foot or Bike",
"Understanding Oxygen Consumption and Exercise Efficiency",
"The Role of Glucose in Brain Function and Performance",
"Understanding the Basics of Weight Loss: Calories In vs. Calories Out",
"The Role of Nutrition in Weight Management",
"Incorporating Portion Control for Weight Loss Success",
"The Benefits of High-Fiber Foods for Weight Loss",
"Understanding the Psychology of Eating for Weight Management",
"The Role of Protein in Satiety and Weight Loss",
"Creating a Sustainable Diet Plan for Long-Term Weight Loss",
"The Science of Metabolism: Boosting Your Metabolic Rate",
"Navigating Emotional Eating and Stress-Related Weight Gain",
"Incorporating Mindful Eating Practices for Weight Loss",
"Understanding the Importance of Hydration in Weight Management",
"The Role of Sleep in Weight Loss and Appetite Regulation",
"Incorporating Physical Activity for Weight Loss",
"The Benefits of Strength Training for Weight Loss",
"Understanding the Role of Hormones in Weight Regulation",
"Incorporating Interval Training for Effective Fat Loss",
"The Role of Meal Timing in Weight Management",
"Understanding the Impact of Processed Foods on Weight Gain",
"The Benefits of Meal Prep for Weight Loss Success",
"Incorporating Low-Glycemic Index Foods for Stable Blood Sugar",
"Understanding the Role of Gut Health in Weight Management",
"The Science of Weight Plateaus: Breaking Through Sticking Points",
"Incorporating Whole Foods for Nutrient Density and Weight Loss",
"Understanding the Link Between Stress and Weight Gain",
"The Role of Self-Compassion in Weight Loss Journeys",
"Incorporating Intuitive Eating Principles for Weight Management",
"The Benefits of Cooking at Home for Weight Loss",
"Understanding the Role of Macronutrients in Weight Loss",
"Incorporating Healthy Fats for Satiety and Weight Management",
"The Science of Emotional Eating: Coping Strategies and Solutions",
"Understanding the Impact of Sugar on Weight Gain and Health",
"Incorporating Resistance Training for Metabolic Health",
"The Benefits of Walking for Weight Loss and Cardiovascular Health",
"Understanding the Role of Genetics in Weight Management",
"Incorporating Stress Management Techniques for Weight Loss",
"The Science of Thermodynamics and Weight Loss",
"Navigating Social Situations and Eating Out While Dieting",
"Understanding the Role of Insulin Resistance in Weight Gain",
"Incorporating High-Volume, Low-Calorie Foods for Weight Loss",
"The Benefits of Tracking Food Intake and Progress",
"Understanding the Impact of Sleep Deprivation on Weight Gain",
"Incorporating Plant-Based Proteins for Weight Loss",
"The Role of Mindfulness in Breaking Unhealthy Eating Habits",
"Understanding the Link Between Hormonal Imbalance and Weight Gain",
"Incorporating Meditation for Stress Reduction and Weight Management",
"The Benefits of Support Groups and Accountability Partnerships",
"Understanding the Role of Leptin and Ghrelin in Appetite Regulation",
"Incorporating HIIT Workouts for Maximum Caloric Burn",
"The Science of Food Cravings: Causes and Strategies",
"Understanding the Impact of Alcohol Consumption on Weight Loss",
"Incorporating Strategies for Overcoming Plateaus in Weight Loss",
"The Benefits of Setting Realistic and Achievable Goals",
"Understanding the Psychology of Body Image and Self-Esteem",
"Incorporating Behavioral Changes for Long-Term Weight Management",
"The Role of Community and Social Support in Weight Loss",
"Understanding the Impact of Chronic Stress on Weight Gain",
"Incorporating Fiber-Rich Foods for Satiety and Weight Control",
"The Benefits of Intermittent Fasting for Weight Loss",
"Understanding the Connection Between Hormones and Hunger",
"Incorporating Low-Calorie, Nutrient-Dense Foods for Weight Loss",
"The Science of Binge Eating Disorder: Causes and Coping Strategies",
"Understanding the Role of the Microbiome in Weight Management",
"Incorporating Mindful Movement for Weight Loss and Stress Reduction",
"The Benefits of Keeping a Food Journal for Accountability",
"Understanding the Impact of Medications on Weight Gain",
"Incorporating Self-Compassion and Positive Self-Talk in Weight Loss",
"The Role of Cortisol in Belly Fat Accumulation",
"Understanding the Importance of Consistency in Weight Loss Efforts",
"Incorporating Cardiovascular Exercise for Weight Management",
"The Benefits of Meal Timing and Frequency for Weight Loss",
"Understanding the Role of Blood Sugar Regulation in Weight Management",
"Incorporating Healthy Substitutions for High-Calorie Foods",
"The Science of Appetite Control: Strategies for Managing Hunger",
"Understanding the Link Between Depression and Weight Gain",
"Incorporating Structured Meal Plans for Weight Loss Success",
"The Benefits of Cooking Skills and Culinary Knowledge for Weight Management",
"Understanding the Impact of Food Sensitivities on Weight Loss",
"Incorporating Mindfulness-Based Stress Reduction for Weight Management",
"The Role of Environmental Factors in Weight Gain",
"Understanding the Connection Between Sleep Quality and Weight Loss",
"Incorporating Hydration Strategies for Weight Management",
"The Benefits of Reducing Added Sugars for Weight Loss",
"Understanding the Role of Emotional Resilience in Weight Management",
"Incorporating Strength-Based Approaches to Weight Loss",
"The Science of Hormonal Birth Control and Weight Gain",
"Understanding the Impact of Menopause on Weight Management",
"Incorporating Gratitude Practices for Emotional Well-Being and Weight Loss",
"The Benefits of Building a Healthy Relationship with Food for Weight Management",
"Understanding the Role of Self-Regulation in Weight Loss",
"Incorporating Mindful Eating for Improved Digestion and Weight Control",
"The Science of Yo-Yo Dieting: Effects on Metabolism and Weight",
"Understanding the Link Between Chronic Inflammation and Weight Gain",
"Incorporating Resistance Bands for At-Home Workouts and Weight Loss",
"The Benefits of Outdoor Activities for Weight Management",
"Understanding the Impact of Social Media on Body Image and Weight Perception",
"Incorporating Social Support Networks for Sustainable Weight Loss",
"The Role of Cognitive Behavioral Therapy in Weight Management",
"Understanding the Connection Between Childhood Trauma and Weight Gain",
"Incorporating Self-Care Practices for Stress Reduction and Weight Management",
"The Benefits of Balanced Meals and Snacks for Weight Loss",
"Understanding the Impact of Sleep Apnea on Weight and Metabolism",
"Incorporating Mindful Cooking for Healthier Meal Preparation",
"The Role of Hormonal Imbalance in Weight Loss Resistance",
"Understanding the Link Between Chronic Pain and Weight Gain",
"Incorporating Resistance Training for Women and Weight Loss",
"The Benefits of Mindful Movement Practices for Weight Management",
"Understanding the Impact of Environmental Toxins on Weight",
"Incorporating Cooking Classes and Culinary Education for Weight Management",
"The Science of Stress Eating: Coping Mechanisms and Alternatives",
"Understanding the Role of Gut Microbes in Weight Regulation",
"Incorporating Gratitude Journals for Emotional Well-Being and Weight Loss",
"The Benefits of Group Fitness Classes for Weight Management",
"Understanding the Connection Between Gut Health and Weight Loss",
"Incorporating Stress-Relief Techniques for Weight Management",
"The Role of Emotional Intelligence in Weight Loss",
"Understanding the Impact of Artificial Sweeteners on Weight and Health",
"Incorporating Mindfulness-Based Interventions for Weight Management",
"The Benefits of Nutrient Timing for Weight Loss and Muscle Gain",
"Understanding the Link Between Sleep Disorders and Weight Gain",
"Incorporating Family Support Systems for Successful Weight Management",
"The Role of Self-Compassion in Overcoming Weight Loss Challenges",
"Understanding the Impact of Chronic Inflammation on Weight",
"Incorporating Healthy Coping Mechanisms for Stress-Induced Weight Gain",
"The Benefits of Mindfulness Meditation for Emotional Eating",
"Understanding the Connection Between Trauma and Weight Gain",
"Incorporating Outdoor Exercise for Weight Loss and Mental Health",
"The Role of Social Determinants of Health in Weight Management",
"Understanding the Impact of Childhood Obesity on Adult Health",
"Incorporating Mindfulness-Based Stress Reduction for Weight Loss",
"The Benefits of Positive Affirmations for Weight Management",
"Understanding the Link Between Insulin Resistance and Weight Gain",
"Incorporating Nature Therapy for Stress Reduction and Weight Management",
"The Role of Emotional Regulation in Successful Weight Loss",
"Understanding the Connection Between Food Addiction and Weight Gain",
"Incorporating Gratitude Practices for Weight Loss Motivation",
"The Benefits of Animal-Assisted Therapy for Emotional Eating",
"Understanding the Impact of Social Support on Weight Management",
"Incorporating Mindful Walking for Weight Loss and Mental Health",
"The Role of Sleep Hygiene in Weight Regulation",
"Understanding the Connection Between Anxiety and Weight Gain",
"Incorporating Mindfulness-Based Eating for Weight Management",
"The Benefits of Art Therapy for Emotional Wellness and Weight Loss",
"Understanding the Link Between Adverse Childhood Experiences and Weight",
"Incorporating Breathwork for Stress Reduction and Weight Management",
"The Role of Trauma-Informed Care in Weight Loss Programs",
"Understanding the Impact of Body Image Distortion on Weight Perception",
"Incorporating Dance Therapy for Weight Loss and Body Positivity",
"The Benefits of Journaling for Emotional Processing and Weight Management",
"Understanding the Connection Between Perfectionism and Weight Gain",
"Incorporating Animal-Assisted Activities for Weight Management Support",
"The Role of Community Gardens in Promoting Healthy Eating and Weight Loss",
"Understanding the Impact of Environmental Stressors on Weight",
"Incorporating Mindful Breathing Techniques for Stress Reduction and Weight Loss",
"The Benefits of Equine-Assisted Therapy for Emotional Eating Patterns",
"Understanding the Link Between Body Dysmorphia and Weight Obsession",
"Incorporating Gardening for Physical Activity and Weight Management",
"The Role of Social Prescribing in Addressing Emotional Eating Behaviors",
"Understanding the Connection Between Loneliness and Weight Gain",
"Incorporating Mindful Crafting for Stress Reduction and Weight Management",
"The Benefits of Therapeutic Recreation for Emotional Resilience and Weight Loss",
"Understanding the Impact of Environmental Pollution on Weight and Health",
"Incorporating Expressive Arts Therapy for Body Image Healing and Weight Loss",
"The Role of Community Supported Agriculture (CSA) in Healthy Eating and Weight Loss",
"Understanding the Link Between Childhood Adversity and Adult Weight Struggles",
"Incorporating Mindful Coloring for Stress Relief and Weight Management",
"The Benefits of Ecotherapy for Emotional Well-Being and Sustainable Weight Loss"
]

const getRandomTopic = (topicArray) => {
    // Generate a random index within the length of the array
    const randomIndex = Math.floor(Math.random() * topicArray.length);
    
    // Return the string at the randomly generated index
    return topicArray[randomIndex];
}


const makeGptCall = async (prompt, systemPrompt) => {
    let chatGpt = await createGPT();
    const promptString = prompt
    const systemPromptString = systemPrompt
    try {
        const chatCompletion = await chatGpt.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: systemPromptString},
          {role: "user", content: promptString}
        ],
        max_tokens: 4000
        });
        return chatCompletion.choices[0].message.content;
    } catch (error){
        if (error.response) {
            console.log('call failed')
            return 'call failed';
        } else {
            return 'call failed, no error.response'
        }
    }
}

const writeArticleToFile = (articleText, fileName) => {
    // Write the article to a text file
    fs.writeFile(fileName, articleText, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Article has been written to', fileName);
        }
    });
}

const removeQuotes = (str) => {
    return str.replace(/[""]/g, '');
}

const removeTitlePrefix = (inputString) => {
    // Regular expression to match 'title:' or any variation of it
    const regex = /^(title:|title\s*:\s*|title\s*-\s*|title\s*—\s*)/i;

    // Remove the prefix from the string
    const newString = inputString.replace(regex, '');

    return newString.trim(); // Trim any leading or trailing spaces
};

const generateAndPostArticle = async () => {
    console.log('Generating article')
    const topic = getRandomTopic(topicArray)
    const articleTitle = await makeGptCall(topic, systemPromptForGettingTitle)
    const finalArtitleTitle = removeQuotes(articleTitle)
    const finalFinalArticleTitle = removeTitlePrefix(finalArtitleTitle)
    const article = await makeGptCall(finalFinalArticleTitle, defaultSystemPrompt)
    writeArticleToFile(article, 'output.txt')
    console.log('Posting article to blog...')
    const response = await createDraftPost(finalFinalArticleTitle, article)
    const draftID = response.data.draftPost.id
    if (draftID){
        const postId = await publishDraftPost(draftID)
        const postName = await getPostUrl(postId)
        await tweetAboutArticle(finalFinalArticleTitle, postName)
    }
}
const getPostUrl = async (postId) => {
    const id = postId.postId
    
    const apiUrl = `https://www.wixapis.com/blog/v3/posts/${id}`;
    
    const authToken = process.env.WIX_KEY;
    const siteID = process.env.WIX_SITE_ID
    const accountID = process.env.WIX_ACCOUNT_ID;
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken,
                'wix-site-id': siteID,
                'wix-account-id': accountID
            }
        });
        
        return response.data.post.slug
    } catch (error) {
        console.log(error)
        console.error('Error publishing draft post:', error.response ? error.response.data : error.message);
    }
}

const formatString = (inputString) => {
    return inputString.replace(/[^\w\s]/gi, '') // Remove special characters
                      .replace(/\s+/g, '-')       // Replace spaces with '-'
                      .toLowerCase();  
}

const tweetAboutArticle = async (finalArticleTitle, postName) => {
    const urlPostTitle = formatString(finalArticleTitle)
    const fullUrl = `bodycalcai.com/post/${postName}`
    let tweetText = ''
    do {
        tweetText = await makeGptCall(`You write tweets about my blog posts on twitter to get engagement, always 200 characters or less. You use gen z slang to craft tweets to promote the article and use relevant hashtags. I will provide you with the article name.`,
    `The article title is ${urlPostTitle}. Give me a tweet for this.`)

    tweetText = tweetText + ` ${fullUrl}`
    } while (tweetText.length > 280 || tweetText.length == 0)
  
    await sendTweet(tweetText)
}

const getRandomInterval = () => {
    // Get a random number between 3000s (50 min) and  30000s (8 hrs)
    return Math.floor(Math.random() * (28800 - 3000 + 1)) + 300;
}

const automaticallyGenerateAndPost = async () => {
    const intervalInSeconds = getRandomInterval();
    const intervalInMinutes = intervalInSeconds / 60;
    console.log(`Next execution will occur in ${intervalInMinutes} minutes`);
    
    // Schedule the job to run after the random interval
    setTimeout(async () => {
        await generateAndPostArticle();
        await automaticallyGenerateAndPost()
    }, intervalInSeconds * 1000); 
}


// on demand 
const job = async () => {
    console.log('Starting job and generating first post...')
    await generateAndPostArticle()
    console.log('Automatically generating and posting to blog...');
    await automaticallyGenerateAndPost();
}

job()

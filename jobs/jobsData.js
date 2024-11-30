const pool = require('./db'); // Import the pool instance from db.js

const insertScheduledJob = async (job) => {
  console.log('dis da job');
  console.log(job);
  const {
    job_set_id,
    user_id,
    content,
    scheduled_time,
    original_images,
    remaining_images,
    username,
    selected_website,
    picture_post_order,
    schedule_type,
    times_of_day,
    selected_days,
    schedule_interval,
    hour_interval,
    selected_subreddits,
    original_subreddits,
    remaining_subreddits,
    includeCaption,
    captionType
  } = job;

  // Handle times_of_day being null
  const timesOfDayArray = times_of_day ? times_of_day.map(({ hour, minute, ampm }) => {
    return `${hour}:${minute.padStart(2, '0')}${ampm}`;
  }) : [];
  const timesOfDayJson = JSON.stringify(timesOfDayArray);

  // Handle selected_days being null
  const dayNamesMap = {
    S: 'Sunday',
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    Th: 'Thursday',
    F: 'Friday',
    Sa: 'Saturday'
  };

  const selectedDaysArray = selected_days ? Object.entries(selected_days)
    .filter(([day, isSelected]) => isSelected)
    .map(([day]) => dayNamesMap[day]) : [];
  const selectedDaysJson = JSON.stringify(selectedDaysArray);

  const query = `
        INSERT INTO scheduled_jobs (
            job_set_id,
            user_id,
            content,
            scheduled_time,
            original_images,
            remaining_images,
            username,
            selected_website,
            picture_post_order,
            schedule_type,
            times_of_day,
            selected_days,
            schedule_interval,
            hour_interval,
            selected_subreddits,
            original_subreddits,
            remaining_subreddits,
            include_caption,
            type_of_caption,
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
        ) RETURNING id;
    `;

  const values = [
    job_set_id,
    user_id,
    content,
    scheduled_time,
    original_images,
    remaining_images,
    username,
    selected_website,
    picture_post_order,
    schedule_type,
    timesOfDayJson, // Use the JSON formatted data
    selectedDaysJson, // Use the JSON formatted array of selected days
    schedule_interval,
    hour_interval,
    selected_subreddits,
    original_subreddits,
    remaining_subreddits,
    includeCaption,
    captionType
  ];

 

  try {
    const client = await pool.connect();
    try {
      const res = await client.query(query, values);
      return res.rows[0];
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error inserting scheduled job', err);
    throw err;
  }
};



const insertRandomJob = async (job) => {
  const {
    job_set_id,
    user_id,
    content,
    scheduled_time,
    original_images,
    remaining_images,
    username,
    selected_website,
    picture_post_order,
    schedule_type,
    duration_of_job,
    selected_subreddits,
    remaining_subreddits,
    original_subreddits,
    includeCaption,
    captionType
  } = job;

  const query = `
        INSERT INTO random_jobs (
            job_set_id,
            user_id,
            content,
            scheduled_time,
            original_images,
            remaining_images,
            username,
            selected_website,
            picture_post_order,
            schedule_type,
            duration_of_job,
            selected_subreddits,
            remaining_subreddits,
            original_subreddits,
            include_caption,
            type_of_caption,
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
        ) RETURNING id;
    `;

  const values = [
    job_set_id,
    user_id,
    content,
    scheduled_time,
    original_images,
    remaining_images,
    username,
    selected_website,
    picture_post_order,
    schedule_type,
    duration_of_job,
    selected_subreddits,
    remaining_subreddits,
    original_subreddits,
    includeCaption,
    captionType
  ];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    return res.rows[0];
  } catch (err) {
    console.error('Error inserting random job', err);
    throw err;
  }
};

const insertActiveJob = async (job) => {
  console.log('in insert active job');
  console.log(job);
  let {
    job_set_id,
    message_ids,
    number_of_messages,
    user_id,
    content,
    scheduled_time,
    original_images,
    remaining_images,
    username,
    selected_website,
    picture_post_order,
    schedule_type,
    times_of_day,
    selected_days,
    schedule_interval,
    hour_interval,
    duration_of_job,
    selected_subreddits,
    remaining_subreddits,
    original_subreddits,
    includeCaption,
    captionType,
    handle
  } = job;

  // Convert message_ids array to a PostgreSQL array literal
  const messageIdsLiteral = `{${message_ids.map(id => `'${id}'`).join(',')}}`;
  // if (duration_of_job === 'forever') duration_of_job = 999


  // Handle times_of_day being null
  const timesOfDayArray = times_of_day ? times_of_day.map(({ hour, minute, ampm }) => {
    return `${hour}:${minute.padStart(2, '0')}${ampm}`;
  }) : [];
  const timesOfDayJson = JSON.stringify(timesOfDayArray);

  // Handle selected_days being null
  const dayNamesMap = {
    S: 'Sunday',
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    Th: 'Thursday',
    F: 'Friday',
    Sa: 'Saturday'
  };

  const selectedDaysArray = selected_days ? Object.entries(selected_days)
    .filter(([day, isSelected]) => isSelected)
    .map(([day]) => dayNamesMap[day]) : [];
  const selectedDaysJson = JSON.stringify(selectedDaysArray);

  const query = `
        INSERT INTO active_jobs (
            job_set_id,
            message_ids,
            number_of_messages,
            user_id,
            content,
            scheduled_time,
            original_images,
            remaining_images,
            username,
            selected_website,
            picture_post_order,
            schedule_type,
            times_of_day,
            selected_days,
            schedule_interval,
            hour_interval,
            duration_of_job,
            selected_subreddits,
            remaining_subreddits,
            original_subreddits,
            include_caption,
            type_of_caption,
            handle,
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW()
        ) RETURNING id;
    `;

  const values = [
    job_set_id,
    messageIdsLiteral, // Use the PostgreSQL array literal
    number_of_messages,
    user_id,
    content,
    scheduled_time,
    original_images,
    remaining_images,
    username,
    selected_website,
    picture_post_order,
    schedule_type,
    timesOfDayJson, // Use the JSON formatted data
    selectedDaysJson,
    schedule_interval,
    hour_interval,
    duration_of_job,
    selected_subreddits,
    remaining_subreddits,
    original_subreddits,
    includeCaption,
    captionType,
    handle
  ];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    return res.rows[0];
  } catch (err) {
    console.error('Error inserting active job', err);
    throw err;
  }
};

const isJobIdPresent = async (jobSetId) => {
  const query = `
        SELECT EXISTS (
            SELECT 1
            FROM active_jobs
            WHERE job_set_id = $1
        );
    `;

  const values = [jobSetId];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    // Return true if the job ID exists, otherwise false
    return res.rows[0].exists;
  } catch (err) {
    console.error('Error checking if job ID is present', err);
    throw err;
  }
};

const updateActiveJob = async (job) => {
  let {
    job_set_id,
    message_ids,
    number_of_messages,
    user_id,
    content,
    scheduled_time,
    original_images,
    remaining_images,
    username,
    selected_website,
    picture_post_order,
    schedule_type,
    times_of_day,
    selected_days,
    schedule_interval,
    hour_interval,
    duration_of_job,
    selected_subreddits,
    remaining_subreddits,
    original_subreddits,
    include_caption,
    type_of_caption,
    handle
  } = job;

  // Convert message_ids array to a PostgreSQL array literal
  const messageIdsLiteral = `{${message_ids.map(id => `'${id}'`).join(',')}}`;

  // Handle times_of_day being an array of strings
  const timesOfDayArray = times_of_day ? times_of_day.map(time => time) : [];
  const timesOfDayJson = JSON.stringify(timesOfDayArray);

  // Handle selected_days being an array of day names
  const selectedDaysArray = selected_days ? selected_days : [];
  const selectedDaysJson = JSON.stringify(selectedDaysArray);

  const query = `
        UPDATE active_jobs SET
            message_ids = $1,
            number_of_messages = $2,
            user_id = $3,
            content = $4,
            scheduled_time = $5,
            original_images = $6,
            remaining_images = $7,
            username = $8,
            selected_website = $9,
            picture_post_order = $10,
            schedule_type = $11,
            times_of_day = $12,
            selected_days = $13,
            schedule_interval = $14,
            hour_interval = $15,
            duration_of_job = $16,
            selected_subreddits = $17,
            remaining_subreddits = $18,
            original_subreddits = $19,
            include_caption = $20,
            type_of_caption = $21,
            handle = $23,
            updated_at = NOW()
        WHERE job_set_id = $22
        RETURNING id;
    `;

  const values = [
    messageIdsLiteral, // Use the PostgreSQL array literal
    number_of_messages,
    user_id,
    content,
    scheduled_time,
    original_images,
    remaining_images,
    username,
    selected_website,
    picture_post_order,
    schedule_type,
    timesOfDayJson, // Use the JSON formatted data
    selectedDaysJson,
    schedule_interval,
    hour_interval,
    duration_of_job,
    selected_subreddits,
    remaining_subreddits,
    original_subreddits,
    include_caption,
    type_of_caption,
    job_set_id,
    handle
  ];


  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    return res.rows[0];
  } catch (err) {
    console.error('Error updating active job', err);
    throw err;
  }
};

const getActiveJobsByUserId = async (userId) => {
  const query = `
        SELECT *
        FROM active_jobs
        WHERE user_id = $1;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [userId]);
    client.release();

    return res.rows;
  } catch (err) {
    console.error('Error retrieving active jobs', err);
    throw err;
  }
};

const deleteActiveJobByJobSetId = async (jobSetId) => {
  console.log(jobSetId);
  console.log('job set id from within delete function');
  const query = `
        DELETE FROM active_jobs
        WHERE job_set_id = $1
        RETURNING *;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [jobSetId]);
    client.release();

    return res.rows[0]; // Return the deleted job
  } catch (err) {
    console.error('Error deleting active job', err);
    throw err;
  }
};

const deleteActivePostJobByJobSetId = async (jobSetId) => {
  console.log(jobSetId);
  console.log('job set id from within delete function');
  const query = `
        DELETE FROM postjobs
        WHERE job_set_id = $1
        RETURNING *;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [jobSetId]);
    client.release();

    return res.rows[0]; // Return the deleted job
  } catch (err) {
    console.error('Error deleting active job', err);
    throw err;
  }
};

const deleteMessageIdFromJob = async (job_set_id, message_id) => {
  console.log('attempting to delete message id...');

  const selectQuery = `
        SELECT message_ids
        FROM active_jobs
        WHERE job_set_id = $1;
    `;

  const updateQuery = `
        UPDATE active_jobs
        SET message_ids = $1, updated_at = NOW()
        WHERE job_set_id = $2;
    `;

  try {
    const client = await pool.connect();
        
    // Retrieve the current message_ids for the job
    const res = await client.query(selectQuery, [job_set_id]);
    if (res.rows.length === 0) {
      client.release();
      throw new Error(`Job with job_set_id ${job_set_id} not found.`);
    }
        
    let { message_ids } = res.rows[0];
    console.log(message_ids);
    console.log('message ids from rows ^^^');
        
    // Ensure message_id is formatted correctly for comparison
    const formattedMessageId = `'${message_id}'`;

    // Remove the message_id from the array
    const updatedMessageIds = message_ids.filter(id => id !== formattedMessageId);
    console.log(updatedMessageIds);
    console.log('updated message ids from rows ^^^');

    // Update the job with the new message_ids array
    await client.query(updateQuery, [updatedMessageIds, job_set_id]);
    client.release();
        
    console.log('Message ID deleted successfully.');
  } catch (err) {
    console.error('Error deleting message_id from job', err);
    throw err;
  }
};


const getMessageIdsCountForJob = async (job_set_id) => {
  const query = `
        SELECT message_ids
        FROM active_jobs
        WHERE job_set_id = $1;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [job_set_id]);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`Job with job_set_id ${job_set_id} not found.`);
    }

    const { message_ids } = res.rows[0];
    return message_ids.length;
  } catch (err) {
    console.error('Error getting message_ids count for job', err);
    throw err;
  }
};

const getDurationOfJob = async (job_set_id) => {
  const query = `
        SELECT duration_of_job
        FROM active_jobs
        WHERE job_set_id = $1;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [job_set_id]);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`Job with job_set_id ${job_set_id} not found.`);
    }

    const { duration_of_job } = res.rows[0];
    return duration_of_job;
  } catch (err) {
    console.error('Error getting duration of job', err);
    throw err;
  }
};


const getJobSetById = async (jobSetId) => {
  const query = `
        SELECT 
            job_set_id,
            message_ids,
            number_of_messages,
            user_id,
            content,
            scheduled_time,
            original_images,
            remaining_images,
            username,
            selected_website,
            picture_post_order,
            schedule_type,
            times_of_day,
            selected_days,
            schedule_interval,
            hour_interval,
            duration_of_job,
            selected_subreddits,
            remaining_subreddits,
            original_subreddits,
            include_caption,
            type_of_caption,
            handle,
            created_at,
            updated_at
        FROM active_jobs
        WHERE job_set_id = $1;
    `;

  const values = [jobSetId];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`No job found with job_set_id: ${jobSetId}`);
    }

    return res.rows[0];
  } catch (err) {
    console.error('Error retrieving job set by ID', err);
    throw err;
  }
};

const insertPostJob = async (postJob) => {
  console.log('Inserting post job');
  console.log(postJob);

  if (!postJob.job_set_id) {
    console.log('not writing to')
    return null
  }

  let {
    job_set_id,
    message_ids,
    numberOfMessages,
    userid,
    jobType,
    username,
    selectedWebsite,
    picturePostOrder,
    scheduleType,
    scheduleInterval,
    hourInterval,
    timesOfDay,
    selectedDays,
    selectedImages,
    durationOfJob,
    selectedSubreddits,
    postType,
    tweetInputs,
    aiPrompt,
    redditPosts,
    numberOfPosts,
    handle
  } = postJob;

  // Convert message_ids array to PostgreSQL array literal
  const messageIdsLiteral = message_ids && message_ids.length
    ? `{${message_ids.map(id => `'${id}'`).join(',')}}`
    : {}; // Handle empty array

  // Handle times_of_day being null or empty
  const timesOfDayArray = timesOfDay ? timesOfDay.map(({ hour, minute, ampm }) => {
    return `${hour}:${minute.padStart(2, '0')}${ampm}`;
  }) : [];
  const timesOfDayJson = timesOfDayArray.length ? JSON.stringify(timesOfDayArray) : null;

  // Handle selected_days being null or empty
  const dayNamesMap = {
    S: 'Sunday',
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    Th: 'Thursday',
    F: 'Friday',
    Sa: 'Saturday'
  };

  const selectedDaysArray = selectedDays ? Object.entries(selectedDays)
    .filter(([day, isSelected]) => isSelected)
    .map(([day]) => dayNamesMap[day]) : [];
  const selectedDaysJson = selectedDaysArray.length ? JSON.stringify(selectedDaysArray) : null;

  const query = `
    INSERT INTO postjobs (
      job_set_id,
      message_ids,
      numberOfMessages,
      userid,
      jobType,
      username,
      selectedWebsite,
      picturePostOrder,
      scheduleType,
      scheduleInterval,
      hourInterval,
      timesOfDay,
      selectedDays,
      selectedImages,
      durationOfJob,
      selectedSubreddits,
      postType,
      tweetInputs,
      aiPrompt,
      redditPosts,
      numberOfPosts,
      postsCreated,
      handle
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::INT[], $9, $10, $11, $12, $13, $14::TEXT[], $15, $16::jsonb[], $17, $18::jsonb[], $19, $20::jsonb[], $21, $22, $23
    ) RETURNING id;
  `;

  const values = [
    job_set_id,
    messageIdsLiteral,           
    numberOfMessages,
    userid,
    jobType,
    username,
    selectedWebsite,
    {},     
    scheduleType,
    scheduleInterval || null,    
    hourInterval || null,        
    timesOfDayJson,              
    selectedDaysJson,            
    selectedImages,      
    durationOfJob || 999,       
    selectedSubreddits,      
    postType,
    tweetInputs,             
    aiPrompt,                
    redditPosts,             
    parseInt(numberOfPosts, 10) || 999,
    numberOfMessages, // posts created is the number of messages created.
    handle
  ];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    return res.rows[0]; // Return the inserted post job object
  } catch (err) {
    console.error('Error inserting post job', err);
    throw err;
  }
};


const updatePostJob = async (postJob) => {
  let {
    message_ids,
    numberOfMessages,
    userid,
    jobType,
    username,
    selectedWebsite,
    picturePostOrder,
    scheduleType,
    scheduleInterval,
    hourInterval,
    timesOfDay,
    selectedDays,
    selectedImages,
    durationOfJob,
    selectedSubreddits,
    postType,
    tweetInputs,
    aiPrompt,
    redditPosts,
    numberOfPosts,
    handle
  } = postJob;
  let job_set_id = postJob?.jobSetId || postJob?.job_set_id
  // Convert message_ids array to PostgreSQL array literal
  const messageIdsLiteral = message_ids && message_ids.length
    ? `{${message_ids.map(id => `'${id}'`).join(',')}}`
    : {}; // Handle empty array

  // Handle times_of_day being null or empty
  const timesOfDayArray = timesOfDay ? timesOfDay.map(({ hour, minute, ampm }) => {
    return `${hour}:${minute.padStart(2, '0')}${ampm}`;
  }) : [];
  const timesOfDayJson = timesOfDayArray.length ? JSON.stringify(timesOfDayArray) : null;

  // Handle selected_days being null or empty
  const dayNamesMap = {
    S: 'Sunday',
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    Th: 'Thursday',
    F: 'Friday',
    Sa: 'Saturday'
  };

  const selectedDaysArray = selectedDays ? Object.entries(selectedDays)
    .filter(([day, isSelected]) => isSelected)
    .map(([day]) => dayNamesMap[day]) : [];
  const selectedDaysJson = selectedDaysArray.length ? JSON.stringify(selectedDaysArray) : null;

  const query = `
        UPDATE postjobs SET
            message_ids = $1,
            numberOfMessages = $2,
            userid = $3,
            jobType = $4,
            username = $5,
            selectedWebsite = $6,
            picturePostOrder = $7::INT[],
            scheduleType = $8,
            scheduleInterval = $9,
            hourInterval = $10,
            timesOfDay = $11,
            selectedDays = $12,
            selectedImages = $13::TEXT[],
            durationOfJob = $14,
            selectedSubreddits = $15::jsonb[],
            postType = $16,
            tweetInputs = $17::jsonb[],
            aiPrompt = $18::jsonb,
            redditPosts = $19::jsonb[],
            numberOfPosts = $20,
            handle = $22
        WHERE job_set_id = $21
        RETURNING id;
    `;

  const values = [
    messageIdsLiteral, // Use the PostgreSQL array literal
    numberOfMessages,
    userid,
    jobType,
    username,
    selectedWebsite,
    {},
    scheduleType,
    scheduleInterval || null,    // Handle potential null
    hourInterval || null,        // Handle potential null
    timesOfDayJson,              // Use the JSON formatted data
    selectedDaysJson,            // Use the JSON formatted data
    selectedImages,              // Assume selectedImages is an array
    durationOfJob || 999,        // Default value if null
    selectedSubreddits,          // Assume this is a JSONB array
    postType,
    tweetInputs,                 // JSONB array
    aiPrompt,                    // JSONB array
    redditPosts,                 // JSONB array
    numberOfPosts, // Ensure numberOfPosts is an integer
    job_set_id,                   // job_set_id for WHERE clause
    handle
  ];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    return res.rows[0]; // Return the updated post job object
  } catch (err) {
    console.error('Error updating post job', err);
    throw err;
  }
};

const deleteTweetInputFromPostJob = async (job_set_id, tweetInputToDelete) => {
  console.log('Attempting to delete tweet input from post job...');
  console.log('Tweet input to delete:', tweetInputToDelete);
  console.log('Job set ID:', job_set_id);

  const selectQuery = `
    SELECT tweetinputs
    FROM postjobs
    WHERE job_set_id = $1;
  `;

  const updateQuery = `
    UPDATE postjobs
    SET tweetinputs = $1
    WHERE job_set_id = $2;
  `;

  try {
    const client = await pool.connect();

    // Retrieve the current tweetInputs for the post job
    const res = await client.query(selectQuery, [job_set_id]);
    if (res.rows.length === 0) {
      client.release();
      throw new Error(`Post job with job_set_id ${job_set_id} not found.`);
    }

    let { tweetinputs } = res.rows[0];

    // If tweetInputs is not an array, return an error
    if (!Array.isArray(tweetinputs)) {
      throw new Error('tweetinputs is not an array');
    }

    console.log('Original tweetInputs:', tweetinputs);

    // Filter out the tweet input based on a deep comparison of each field
    const updatedTweetInputs = tweetinputs.filter(input => {
      return !(
        input.id === tweetInputToDelete.id &&
        input.date === tweetInputToDelete.date &&
        input.text === tweetInputToDelete.text &&
        input.time.ampm === tweetInputToDelete.time.ampm &&
        input.time.hour === tweetInputToDelete.time.hour &&
        input.time.minute === tweetInputToDelete.time.minute
      );
    });

    console.log('Updated tweetInputs:', updatedTweetInputs);

    // Update the post job with the new tweetInputs array
    await client.query(updateQuery, [updatedTweetInputs, job_set_id]);

    client.release();
    console.log('Tweet input deleted successfully from post job.');
  } catch (err) {
    console.error('Error deleting tweet input from post job', err);
    throw err;
  }
};

const deleteRedditPostFromPostJob = async (job_set_id, redditPostToDelete) => {
  console.log('Attempting to delete reddit post from post job...');
  console.log('Reddit post to delete:', redditPostToDelete);
  console.log('Job set ID:', job_set_id);

  const selectQuery = `
    SELECT redditposts
    FROM postjobs
    WHERE job_set_id = $1;
  `;

  const updateQuery = `
    UPDATE postjobs
    SET redditposts = $1
    WHERE job_set_id = $2;
  `;

  try {
    const client = await pool.connect();

    // Retrieve the current redditPosts for the post job
    const res = await client.query(selectQuery, [job_set_id]);
    if (res.rows.length === 0) {
      client.release();
      throw new Error(`Post job with job_set_id ${job_set_id} not found.`);
    }

    let { redditposts } = res.rows[0];

    // If redditPosts is not an array, return an error
    if (!Array.isArray(redditposts)) {
      throw new Error('redditposts is not an array');
    }

    console.log('Original redditPosts:', redditposts);

    // Filter out the reddit post based on a deep comparison of each field
    const updatedRedditPosts = redditposts.filter(post => {
      return !(
        post.id === redditPostToDelete.id &&
        post.date === redditPostToDelete.date &&
        post.text === redditPostToDelete.text &&
        post.time.ampm === redditPostToDelete.time.ampm &&
        post.time.hour === redditPostToDelete.time.hour &&
        post.time.minute === redditPostToDelete.time.minute
      );
    });

    console.log('Updated redditPosts:', updatedRedditPosts);

    // Update the post job with the new redditPosts array
    await client.query(updateQuery, [updatedRedditPosts, job_set_id]);

    client.release();
    console.log('Reddit post deleted successfully from post job.');
  } catch (err) {
    console.error('Error deleting reddit post from post job', err);
    throw err;
  }
};



const deleteMessageIdFromPostJob = async (job_set_id, message_id) => {
  console.log('Attempting to delete message id from post job...');
  console.log('Message ID to delete:', message_id);
  console.log('Job set ID:', job_set_id);

  const selectQuery = `
    SELECT message_ids
    FROM postjobs
    WHERE job_set_id = $1;
  `;

  const updateQuery = `
    UPDATE postjobs
    SET message_ids = $1
    WHERE job_set_id = $2;
  `;

  try {
    const client = await pool.connect();

    // Retrieve the current message_ids for the post job
    const res = await client.query(selectQuery, [job_set_id]);
    if (res.rows.length === 0) {
      client.release();
      throw new Error(`Post job with job_set_id ${job_set_id} not found.`);
    }

    let { message_ids } = res.rows[0];

    // If message_ids are stored as a string, remove any surrounding quotes
    if (typeof message_ids === 'string') {
      message_ids = JSON.parse(message_ids);
    }

    console.log('Original message IDs:', message_ids);

    // Remove surrounding quotes from message_id
    const formattedMessageId = message_id.replace(/^['"]|['"]$/g, '');

    // Filter out the message_id from the array
    const updatedMessageIds = message_ids.filter(id => id.replace(/^['"]|['"]$/g, '') !== formattedMessageId);
    console.log('Updated message IDs:', updatedMessageIds);

    // Handle empty array case for PostgreSQL
    // const finalMessageIds = updatedMessageIds.length > 0 ? updatedMessageIds : null;

    // Update the post job with the new message_ids array or set it to NULL if the array is empty
    await client.query(updateQuery, [updatedMessageIds, job_set_id]);

    client.release();
    console.log('Message ID deleted successfully from post job.');
  } catch (err) {
    console.error('Error deleting message_id from post job', err);
    throw err;
  }
};



const getMessageIdsCountForPostJob = async (job_set_id) => {
  const query = `
        SELECT message_ids
        FROM postjobs
        WHERE job_set_id = $1;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [job_set_id]);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`Post job with job_set_id ${job_set_id} not found.`);
    }

    const { message_ids } = res.rows[0];
    // Assuming message_ids is stored as an array in the database
    return message_ids.length; // Return the count of message_ids
  } catch (err) {
    console.error('Error getting message_ids count for post job', err);
    throw err;
  }
};

const deletePostJobByJobSetId = async (jobSetId) => {
  const query = `
        DELETE FROM postjobs
        WHERE job_set_id = $1
        RETURNING *;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [jobSetId]);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`Post job with job_set_id ${jobSetId} not found.`);
    }

    return res.rows[0]; // Return the deleted post job
  } catch (err) {
    console.error('Error deleting post job', err);
    throw err;
  }
};

const getPostJobsByUserId = async (userId) => {
  const query = `
        SELECT *
        FROM postjobs
        WHERE user_id = $1;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [userId]);
    client.release();

    return res.rows; // Return an array of post jobs
  } catch (err) {
    console.error('Error retrieving post jobs', err);
    throw err;
  }
};

const getPostJobById = async (postJobId) => {
  const query = `
        SELECT 
            id,
            job_set_id,
            message_ids,
            numberofmessages,
            userid,
            jobtype,
            username,
            selectedwebsite,
            picturepostorder,
            scheduletype,
            scheduleinterval,
            hourinterval,
            timesofday,
            selecteddays,
            selectedimages,
            durationofjob,
            selectedsubreddits,
            posttype,
            tweetinputs,
            aiprompt,
            redditposts,
            numberofposts,
            postsCreated,
            handle
        FROM postjobs
        WHERE job_set_id = $1;
    `;

  const values = [postJobId];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`No post job found with post_job_id: ${postJobId}`);
    }

    return res.rows[0]; // Return the post job details
  } catch (err) {
    console.error('Error retrieving post job by ID', err);
    throw err;
  }
};

const isPostJobPresent = async (jobSetId) => {
  const query = `
        SELECT EXISTS (
            SELECT 1
            FROM postjobs
            WHERE job_set_id = $1
        );
    `;

  const values = [jobSetId];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    // Return true if the post job ID exists, otherwise false
    return res.rows[0].exists;
  } catch (err) {
    console.error('Error checking if post job is present', err);
    throw err;
  }
};

const getActivePostJobsByUserId = async (userId) => {
  const query = `
        SELECT *
        FROM postjobs
        WHERE userid = $1;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [userId]);
    client.release();

    return res.rows;
  } catch (err) {
    console.error('Error retrieving active jobs', err);
    throw err;
  }
};

const getUserBySubreddit = async (subreddits) => {
  const query = `
    SELECT *
    FROM subreddits
    WHERE subredditName = ANY($1::varchar[]);
  `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [subreddits]);
    client.release();
    // console.log(res.rows)
    // console.log('in getuserbysubreddit')
    return res.rows;
  } catch (err) {
    console.error('Error retrieving subreddits', err);
    throw err;
  }
};

const upsertSubreddits = async (subreddits) => {
  const query = `
    INSERT INTO subreddits (subredditName, activePosters, activeCommenters, lastUpdate)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (subredditName)
    DO UPDATE SET
      activePosters = ARRAY(SELECT DISTINCT UNNEST(COALESCE(subreddits.activePosters, '{}') || EXCLUDED.activePosters)),
      activeCommenters = ARRAY(SELECT DISTINCT UNNEST(COALESCE(subreddits.activeCommenters, '{}') || EXCLUDED.activeCommenters)),
      lastUpdate = EXCLUDED.lastUpdate
    RETURNING *;
  `;

  const formatDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  try {
    const client = await pool.connect();
    const results = [];

    for (const subreddit of subreddits) {
      const { subredditName, activePosters = [], activeCommenters = [] } = subreddit;

      // Execute the query, passing in the subreddit data
      const res = await client.query(query, [
        subredditName,
        activePosters, // New active posters (array)
        activeCommenters, // New active commenters (array)
        formatDate(),
      ]);

      results.push(res.rows[0]);
    }

    client.release();
    return results; // Return all upserted rows
  } catch (err) {
    console.error('Error upserting subreddits', err);
    throw err; // Re-throw the error to handle it further up the stack if needed
  }
};

const insertDMJob = async (dmJob) => {
  console.log('Inserting DM job');
  console.log(dmJob);

  const {
    job_set_id,
    message_ids,
    userid,
    jobType,
    handle,
    selectedWebsite,
    selectedSubreddits,
    aiPrompt,
    userDM,
    dmCount
  } = dmJob;

  // Convert message_ids array to PostgreSQL array literal
  const messageIdsLiteral = message_ids && message_ids.length
    ? `{${message_ids.map(id => `'${id}'`).join(',')}}`
    : null; // Handle empty array

  const query = `
    INSERT INTO dmjobs (
      job_set_id,
      message_ids,
      userid,
      jobType,
      handle,
      selectedWebsite,
      selectedSubreddits,
      aiPrompt,
      userDM,
      dmCount
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7::TEXT[], $8::JSONB, $9::JSONB, $10
    ) RETURNING id;
  `;

  const values = [
    job_set_id,
    messageIdsLiteral,
    userid,
    jobType,
    handle,
    selectedWebsite,
    selectedSubreddits || null, // Handle null or empty subreddits
    aiPrompt || null,          // Handle null or empty AI prompt
    userDM || null,            // Handle null or empty user DM
    dmCount
  ];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    return res.rows[0]; // Return the inserted DM job object
  } catch (err) {
    console.error('Error inserting DM job', err);
    throw err;
  }
};

const isDMJobPresent = async (jobSetId) => {
  const query = `
        SELECT EXISTS (
            SELECT 1
            FROM dmjobs
            WHERE job_set_id = $1
        );
    `;

  const values = [jobSetId];

  try {
    const client = await pool.connect();
    const res = await client.query(query, values);
    client.release();

    // Return true if the DM job ID exists, otherwise false
    return res.rows[0].exists;
  } catch (err) {
    console.error('Error checking if DM job is present', err);
    throw err;
  }
};


const deleteMessageIdFromDMJob = async (job_set_id, message_id) => {
  console.log('Attempting to delete message ID from DM job...');
  console.log('Message ID to delete:', message_id);
  console.log('Job set ID:', job_set_id);

  const selectQuery = `
    SELECT message_ids
    FROM dmjobs
    WHERE job_set_id = $1;
  `;

  const updateQuery = `
    UPDATE dmjobs
    SET message_ids = $1
    WHERE job_set_id = $2;
  `;

  try {
    const client = await pool.connect();

    // Retrieve the current message_ids for the DM job
    const res = await client.query(selectQuery, [job_set_id]);
    if (res.rows.length === 0) {
      client.release();
      throw new Error(`DM job with job_set_id ${job_set_id} not found.`);
    }

    let { message_ids } = res.rows[0];

    // If message_ids are stored as a string, parse it into an array
    if (typeof message_ids === 'string') {
      message_ids = JSON.parse(message_ids);
    }

    console.log('Original message IDs:', message_ids);

    // Remove surrounding quotes from message_id
    const formattedMessageId = message_id.replace(/^['"]|['"]$/g, '');

    // Filter out the message_id from the array
    const updatedMessageIds = message_ids.filter(id => id.replace(/^['"]|['"]$/g, '') !== formattedMessageId);
    console.log('Updated message IDs:', updatedMessageIds);

    // Update the DM job with the new message_ids array
    await client.query(updateQuery, [updatedMessageIds, job_set_id]);

    client.release();
    console.log('Message ID deleted successfully from DM job.');
  } catch (err) {
    console.error('Error deleting message_id from DM job', err);
    throw err;
  }
};

const getMessageIdsCountForDMJob = async (job_set_id) => {
  const query = `
        SELECT message_ids
        FROM dmjobs
        WHERE job_set_id = $1;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [job_set_id]);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`DM job with job_set_id ${job_set_id} not found.`);
    }

    const { message_ids } = res.rows[0];

    // If message_ids is null or empty, return 0
    if (!message_ids || message_ids.length === 0) {
      return 0;
    }

    // If message_ids is a string, parse it into an array
    const parsedMessageIds = typeof message_ids === 'string' ? JSON.parse(message_ids) : message_ids;

    return parsedMessageIds.length;
  } catch (err) {
    console.error('Error getting message_ids count for DM job', err);
    throw err;
  }
};

const deleteDMJobByJobSetId = async (jobSetId) => {
  const query = `
        DELETE FROM dmjobs
        WHERE job_set_id = $1
        RETURNING *;
    `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [jobSetId]);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`DM job with job_set_id ${jobSetId} not found.`);
    }

    return res.rows[0]; // Return the deleted DM job
  } catch (err) {
    console.error('Error deleting DM job', err);
    throw err;
  }
};

const updateDMJobByJobSetId = async (jobSetId, newMessageIds) => {
  const query = `
    UPDATE dmjobs
    SET message_ids = $1
    WHERE job_set_id = $2
    RETURNING *;
  `;

  try {
    const client = await pool.connect();
    const res = await client.query(query, [newMessageIds, jobSetId]);
    client.release();

    if (res.rows.length === 0) {
      throw new Error(`DM job with job_set_id ${jobSetId} not found.`);
    }

    console.log('DM job updated successfully:', res.rows[0]);
    return res.rows[0]; // Return the updated job
  } catch (err) {
    console.error('Error updating DM job by job_set_id', err);
    throw err;
  }
};



module.exports = {
  insertScheduledJob,
  insertRandomJob,
  insertActiveJob,
  isJobIdPresent,
  getActiveJobsByUserId,
  deleteActiveJobByJobSetId,
  deleteMessageIdFromJob,
  getMessageIdsCountForJob,
  getJobSetById,
  updateActiveJob,
  getDurationOfJob,
  insertPostJob,
  isPostJobPresent,
  getMessageIdsCountForPostJob,
  deleteMessageIdFromPostJob,
  getPostJobById,
  deletePostJobByJobSetId,
  updatePostJob,
  getActivePostJobsByUserId,
  deleteActivePostJobByJobSetId,
  deleteTweetInputFromPostJob,
  deleteRedditPostFromPostJob,
  getUserBySubreddit,
  upsertSubreddits,
  insertDMJob,
  isDMJobPresent,
  deleteMessageIdFromDMJob,
  getMessageIdsCountForDMJob,
  deleteDMJobByJobSetId,
  updateDMJobByJobSetId
};

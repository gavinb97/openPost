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
    numberOfPosts
  } = postJob;

  // Convert message_ids array to PostgreSQL array literal
  const messageIdsLiteral = message_ids && message_ids.length
    ? `{${message_ids.map(id => `'${id}'`).join(',')}}`
    : 'ARRAY[]::TEXT[]'; // Handle empty array

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
      postsCreated
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::INT[], $9, $10, $11, $12, $13, $14::TEXT[], $15, $16::jsonb[], $17, $18::jsonb[], $19, $20::jsonb[], $21, $22
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
    parseInt(numberOfPosts, 10),
    numberOfMessages // posts created is the number of messages created.
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
    numberOfPosts
  } = postJob;

  // Convert message_ids array to PostgreSQL array literal
  const messageIdsLiteral = message_ids && message_ids.length
    ? `{${message_ids.map(id => `'${id}'`).join(',')}}`
    : 'ARRAY[]::TEXT[]'; // Handle empty array

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
            aiPrompt = $18::jsonb[],
            redditPosts = $19::jsonb[],
            numberOfPosts = $20,
            updated_at = NOW()
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
    picturePostOrder,
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
    parseInt(numberOfPosts, 10), // Ensure numberOfPosts is an integer
    job_set_id                   // job_set_id for WHERE clause
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


const deleteMessageIdFromPostJob = async (job_set_id, message_id) => {
  console.log('Attempting to delete message id from post job...');

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
    console.log(message_ids);
    console.log('Message ids from rows ^^^');

    // Ensure message_id is formatted correctly for comparison
    const formattedMessageId = message_id; // Adjust based on your database schema

    // Remove the message_id from the array
    const updatedMessageIds = message_ids.filter(id => id !== formattedMessageId);
    console.log(updatedMessageIds);
    console.log('Updated message ids from rows ^^^');

    // Update the post job with the new message_ids array
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
            number_of_messages,
            userid,
            jobtype,
            username,
            selectedwebsite,
            picuturepostorder,
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
            postsCreated
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
  updatePostJob
};

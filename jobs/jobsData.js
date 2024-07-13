const pool = require('./db'); // Import the pool instance from db.js

const insertScheduledJob = async (job) => {
    console.log('dis da job')
    console.log(job)
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
        captionType
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
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW()
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
        captionType
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
        type_of_caption
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
        job_set_id
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
    getDurationOfJob
};

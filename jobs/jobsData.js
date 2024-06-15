const pool = require('./db'); // Import the pool instance from db.js

const insertScheduledJob = async (job) => {
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
        selected_subreddits
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
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, $14, $15, NOW(), NOW()
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
        selected_subreddits
    ];

    console.log('values');
    console.log(values);

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
        selected_subreddits
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
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
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
        selected_subreddits
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
        selected_subreddits
    } = job;

    // Convert message_ids array to a PostgreSQL array literal
    const messageIdsLiteral = `{${message_ids.map(id => `'${id}'`).join(',')}}`;
    if (duration_of_job === 'forever') duration_of_job = 0


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
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
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
        selected_subreddits
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

module.exports = {
    insertScheduledJob,
    insertRandomJob,
    insertActiveJob,
    isJobIdPresent,
    getActiveJobsByUserId,
    deleteActiveJobByJobSetId
};

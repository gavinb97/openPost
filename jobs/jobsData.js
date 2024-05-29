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

    // Stringify and then parse the times_of_day array to ensure it's valid JSON
    const timesOfDayJson = JSON.stringify(times_of_day);

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
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
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
        selected_days,
        schedule_interval,
        hour_interval,
        selected_subreddits
    ];

    try {
        const client = await pool.connect();
        const res = await client.query(query, values);
        client.release();

        return res.rows[0];
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
        times_of_day,
        selected_days,
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



module.exports = {
    insertScheduledJob,
    insertRandomJob,
    insertActiveJob
};

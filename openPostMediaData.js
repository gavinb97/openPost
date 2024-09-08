const pool = require('../openPost/jobs/db');



const writePhotoMetadata = async (metadata, username) => {
  if (!metadata || !metadata.name) {
    throw new Error('Metadata must contain a valid name.');
  }
  
  try {
    // Connect to the pool
    const client = await pool.connect();
  
    try {
      // Insert the metadata into the photometadata table
      const insertQuery = `
          INSERT INTO photometadata (name, description, categories, nsfw, username)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, description, categories, nsfw, username;
        `;
  
      const result = await client.query(insertQuery, [
        metadata.name,
        metadata.description,
        metadata.categories,
        metadata.nsfw,
        username
      ]);
  
      console.log('Photo metadata inserted successfully:', result.rows[0]);
  
      // Return the inserted row
      return result.rows[0];
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    throw new Error(`Failed to insert photo metadata: ${error.message}`);
  }
};

const readPhotoDataFromDB = async (username) => {
  try {
    // Connect to the pool
    const client = await pool.connect();
  
    try {
      // Query the database for photo metadata for the given username
      const query = `
          SELECT name, description, categories, nsfw 
          FROM photometadata 
          WHERE username LIKE $1;
        `;
  
      // Assuming 'username' is part of the file name, use a pattern to search for photos related to the username
      const result = await client.query(query, [`${username}%`]);
  
      if (result.rows.length === 0) {
        console.log('No photo metadata found for this user.');
        return [];
      }
  
      // Return the result rows as an array of metadata objects
      return result.rows;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error reading photo data from DB:', error);
    return [];
  }
};

const readPhotoDataFromDBUserAndFile = async (username, fileName) => {
    console.log('in read photo from db')
    console.log(username)
    console.log(fileName)
  try {
    // Connect to the pool
    const client = await pool.connect();
  
    try {
      // Query the database for photo metadata by username and file name
      const query = `
          SELECT name, description, categories, nsfw 
          FROM photometadata 
          WHERE username = $1 AND name = $2;
        `;
  
      // Execute the query with the provided username and file name
      const result = await client.query(query, [username, fileName]);
  
      if (result.rows.length === 0) {
        console.log('File not found.');
        return { message: 'File not found' };
      }
  
      // Return the metadata for the file
      return result.rows[0];
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error reading photo data from DB:', error);
    return { message: 'Error reading photo data' };
  }
};
  


const updateMetadataDB = async (newData) => {
  try {
    // Connect to the pool
    const client = await pool.connect();
  
    try {
      for (const newObj of newData) {
        // Check if the photo metadata with the given name already exists
        const checkQuery = `
            SELECT * FROM photometadata WHERE name = $1;
          `;
        const checkResult = await client.query(checkQuery, [newObj.name]);
  
        if (checkResult.rows.length > 0) {
          // If it exists, update the record
          const updateQuery = `
              UPDATE photometadata
              SET description = $1, categories = $2, nsfw = $3
              WHERE name = $4;
            `;
          await client.query(updateQuery, [
            newObj.description,
            newObj.categories,
            newObj.nsfw,
            newObj.name
          ]);
        } else {
          // If it doesn't exist, insert a new record
          const insertQuery = `
              INSERT INTO photometadata (name, description, categories, NSFW)
              VALUES ($1, $2, $3, $4);
            `;
          await client.query(insertQuery, [
            newObj.name,
            newObj.description,
            newObj.categories,
            newObj.nsfw
          ]);
        }
      }
  
      console.log('Photo metadata updated/inserted successfully.');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error updating/inserting photo metadata:', error);
    throw new Error('Error updating photo metadata.');
  }
};


const deleteFromPhotoDataDB = async (username, fileNamesToDelete) => {
  try {
    // Connect to the pool
    const client = await pool.connect();
  
    try {
      // Delete photo metadata where the username matches and the name is in the fileNamesToDelete array
      const deleteQuery = `
          DELETE FROM photometadata
          WHERE username = $1
          AND name = ANY($2::text[]);
        `;
        
      await client.query(deleteQuery, [username, fileNamesToDelete]);
  
      console.log('File names deleted successfully from photometadata.');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error deleting file names from photometadata:', error);
    throw new Error('Error deleting photo metadata from database.');
  }
};
  
  
  
  

module.exports = {
  writePhotoMetadata,
  readPhotoDataFromDB,
  updateMetadataDB,
  deleteFromPhotoDataDB,
  readPhotoDataFromDBUserAndFile
};
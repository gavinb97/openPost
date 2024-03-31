import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { WithOutContext as TagInput } from 'react-tag-input';

const TagInputComponent = ({ tags, handleAddition, handleDelete }) => {
  const [inputTags, setInputTags] = useState([]);

  useEffect(() => {
    // Ensure tags are properly formatted as objects with id and text properties
    const formattedTags = tags.map((tag, index) => ({ id: index, text: tag }));
    setInputTags(formattedTags);
  }, [tags]);

  const handleTagAddition = (tag) => {
    setInputTags([...inputTags, { id: inputTags.length, text: tag }]);
    handleAddition(tag);
  };

  const handleTagDelete = (indexToRemove) => {
    handleDelete(indexToRemove); // Pass the index of the deleted tag to the handleDelete function
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', alignItems: 'left' }}>
          <TagInput 
            tags={inputTags.map(tag => tag.text)} // Extract text from each tag object
            handleAddition={handleTagAddition}
            handleDelete={handleTagDelete}
            inputFieldPosition='top'
          />
       
      </div>
    </DndProvider>
  );
};

export default TagInputComponent;

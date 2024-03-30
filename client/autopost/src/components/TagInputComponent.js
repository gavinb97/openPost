import React, { useState } from 'react';
import TagInput from 'react-tag-input';
import 'react-tag-input/example/reactTags.css'

const TagInputComponent = () => {
    const [tags, setTags] = useState([]);
  
    const handleAddition = (tag) => {
      setTags([...tags, tag]);
    };
  
    const handleDelete = (i) => {
      setTags(tags.filter((tag, index) => index !== i));
    };
  
    return (
      <TagInput
        tags={tags}
        handleAddition={handleAddition}
        handleDelete={handleDelete}
      />
    );
  };
  

  export default TagInputComponent;
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {WithOutContext as TagInput} from 'react-tag-input';
// import 'react-tag-input/example/reactTags.css'

const TagInputComponent = () => {
    const [tags, setTags] = useState([]);
  
    const handleAddition = (tag) => {
      setTags([...tags, tag]);
    };
  
    const handleDelete = (i) => {
      setTags(tags.filter((tag, index) => index !== i));
    };
  
    return (
      <DndProvider backend={HTML5Backend}>
        <TagInput
          tags={tags}
          handleAddition={handleAddition}
          handleDelete={handleDelete}
        />
      </DndProvider>
    );
};

export default TagInputComponent;
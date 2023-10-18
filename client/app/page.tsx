'use client';

// imprt dependencies
import React, { FC, useState } from 'react';
import Heading from './utils/Heading';

// setup interface
interface Props {}

const Page: FC<Props> = (props) => {
  return (
    <div>
      <Heading
        title="MernLMS"
        description="MernLMS is a platform for students to learn and get help from teachers"
        keywords="programming, MERN, Redux,Machine Learning"
      />
    </div>
  );
};

export default Page;

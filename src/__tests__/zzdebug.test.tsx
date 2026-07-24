import { describe, it } from 'vitest';
import * as React1 from 'react';
import * as ReactDOM1 from 'react-dom';
import { mockAppsInToss } from '@/__tests__/__helpers__/mocks';
mockAppsInToss();
import * as React2 from 'react';
import * as ReactDOM2 from 'react-dom';

describe('debug', () => {
  it('react/react-dom identity across mock boundary', () => {
    console.log('React same?', React1 === React2, React1.version, React2.version);
    console.log('ReactDOM same?', ReactDOM1 === ReactDOM2);
    console.log('useState same?', React1.useState === React2.useState);
    console.log('createContext same?', React1.createContext === React2.createContext);
  });
});

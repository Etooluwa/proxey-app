/**
 * DEPRECATED — GradientHeader is removed in v6.
 * This stub prevents build errors while pages are being migrated to v6.
 * Replace with <Header /> from './Header' when reskinning each page.
 */
import React from 'react';
import Header from './Header';

const GradientHeader = ({ onMenu, children }) => (
    <>
        <Header onMenu={onMenu} />
        {children}
    </>
);

export default GradientHeader;

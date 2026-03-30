import React from 'react';
import klogo from '../../klogo.png';

/**
 * kliques logo image.
 *
 * @param {number} height - image height in px (default 22)
 */
const Logo = ({ height = 22 }) => (
    <img src={klogo} alt="kliques" style={{ height, width: 'auto', display: 'block' }} />
);

export default Logo;

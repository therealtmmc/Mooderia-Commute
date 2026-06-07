/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import MobileShell from './components/MobileShell';

export default function App() {
  return (
    <div className="w-full h-[100dvh] overflow-hidden min-[851px]:h-auto min-[851px]:min-h-screen min-[851px]:overflow-visible">
      <MobileShell />
    </div>
  );
}

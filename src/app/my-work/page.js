//src/app/my-work/page.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import MyWorkClient from './MyWorkClient';

export default function Page() {
  return <MyWorkClient />;
}
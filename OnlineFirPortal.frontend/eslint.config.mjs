import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Next.js 16 ships native flat configs. Using them directly avoids the
// circular-reference failure that FlatCompat hits with eslint-config-next.
const eslintConfig = [
    ...nextVitals,
    ...nextTypescript,
];

export default eslintConfig;

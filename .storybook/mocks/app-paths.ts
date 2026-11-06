// $app/paths for Storybook: route ids become plain paths, without the route groups.
export const resolve = (route: string) => route.replace(/\/\([^)]+\)/g, '') || '/';
export const asset = (file: string) => file;

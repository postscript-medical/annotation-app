export default function clone(source) {
  return JSON.parse(JSON.stringify(source));
}

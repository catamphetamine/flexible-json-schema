export default function appendPathIndex(path, index) {
  return (path || '') + '[' + (isNaN(index) ? '' : index) + ']';
}

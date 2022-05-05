export default function appendPathKey(path, key) {
  return (path ? path + '.' : '') + key;
}

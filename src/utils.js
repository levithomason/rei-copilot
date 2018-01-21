export const query = obj =>
  Object.keys(obj)
    .map(key => `${key}=${encodeURIComponent(obj[key])}`)
    .join('&')

export const request = (url, params = {}) => {
  return fetch(url + '?' + query(params))
    .then(res => res.json())
    .catch(err => {
      throw err
    })
}

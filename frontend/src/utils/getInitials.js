export default function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase()
}

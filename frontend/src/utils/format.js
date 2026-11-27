const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2,
})
const dates = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

export function formatPrice(price) {
  return Number(price) === 0 ? 'Free' : dollars.format(price)
}

export function formatDate(value) {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime()) ? dates.format(date) : ''
}

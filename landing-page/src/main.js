import './style.css'

// Smooth reveal animation on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        observer.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.15 }
)

document.querySelectorAll('.feature-card, .callout-card, .stats-row, .screenshot-item').forEach((el) => {
  el.classList.add('reveal')
  observer.observe(el)
})

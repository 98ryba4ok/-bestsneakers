import './slider.css'
import { useState } from 'react'

const slides = [
  {
    id: 1,
    label: 'Вид сбоку',
    thumb: '/images/sboky.png',
    big: '/images/bigcros.png',
  },
  {
    id: 2,
    label: 'Подошва',
    thumb: '/images/podoshva.png',
    big: '/images/podoshva.png',
  },
  {
    id: 3,
    label: 'Вид сверху',
    thumb: '/images/bigcros.png',
    big: '/images/sboky.png',
  },
]

export default function Slider() {
  const [active, setActive] = useState(0)

  return (
    <div className="sliderWrap">
      <div className="thumbs">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`thumb${active === idx ? ' active' : ''}`}
            onClick={() => setActive(idx)}
          >
            <img src={slide.thumb} alt={slide.label} className="thumbImg" />
          </div>
        ))}
      </div>
      <div className="main">
        <img src={slides[active].big} alt={slides[active].label} className="bigImg" />
        <button
          className="arrow"
          onClick={() => setActive((active + 1) % slides.length)}
          aria-label="Следующий слайд"
        >
          &gt;
        </button>
      </div>
    </div>
  )
}

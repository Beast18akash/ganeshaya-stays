import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Title from '../components/Title'

const categories = [
  'All',
  'Wellness & Spa',
  'Culinary & Dining',
  'Local Heritage',
  'Private Excursions',
]

const experiences = [
  {
    id: 'sunrise-ritual',
    category: 'Wellness & Spa',
    duration: '90 minutes · Morning',
    title: 'The Sunrise Ritual',
    description: 'Welcome the day with a private yoga flow, guided breathwork, and a nourishing breakfast prepared just for you.',
    image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Sunrise yoga practice overlooking a peaceful landscape',
    highlights: ['Private instructor at your stay', 'All-levels movement and meditation', 'Fresh seasonal breakfast'],
    itinerary: ['Ease into the morning with herbal tea and a gentle welcome.', 'Move through a private, all-levels yoga and breathwork session.', 'Enjoy a seasonal breakfast served at your preferred setting.'],
    includes: ['Private yoga instructor', 'Yoga mats and refreshments', 'Made-to-order breakfast'],
  },
  {
    id: 'restorative-spa',
    category: 'Wellness & Spa',
    duration: '2 hours · By appointment',
    title: 'A Restorative Spa Escape',
    description: 'Unplug with a bespoke treatment designed around your needs, followed by a quiet moment to simply be.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Serene spa pool surrounded by natural stone',
    highlights: ['Personal treatment consultation', 'Choice of signature massage', 'Calming post-treatment refreshments'],
    itinerary: ['Meet your therapist for a short consultation and treatment selection.', 'Settle in for a restorative massage tailored to your preferences.', 'Take time to unwind with calming tea and light refreshments.'],
    includes: ['Licensed private therapist', 'Treatment oils and linens', 'Herbal tea and refreshments'],
  },
  {
    id: 'chef-table',
    category: 'Culinary & Dining',
    duration: '3 hours · Evening',
    title: 'The Chef’s Private Table',
    description: 'Let a local chef bring the region to your table with a thoughtful menu inspired by market finds and family recipes.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Elegant candlelit dinner table set for a special evening',
    highlights: ['Season-led, multi-course menu', 'Local ingredients and stories', 'Dietary preferences welcomed'],
    itinerary: ['Share your tastes and dietary needs with the chef in advance.', 'Meet the chef and discover the inspiration behind the menu.', 'Enjoy a relaxed, multi-course dinner served in your suite or villa.'],
    includes: ['Private chef and service', 'Seasonal multi-course dinner', 'Non-alcoholic pairing'],
  },
  {
    id: 'market-to-table',
    category: 'Culinary & Dining',
    duration: 'Half day · Morning',
    title: 'Market to Table',
    description: 'Explore a neighborhood market with a culinary host, choose the day’s ingredients, then learn to make a local favorite.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Colorful fresh produce at a neighborhood market',
    highlights: ['Guided market walk', 'Hands-on cooking session', 'Recipes to take home'],
    itinerary: ['Wander the market with a local host and meet its makers.', 'Choose fresh ingredients and hear how they shape regional cooking.', 'Prepare and enjoy a relaxed meal together in a private kitchen.'],
    includes: ['Local culinary host', 'Market ingredients', 'Recipe cards and refreshments'],
  },
  {
    id: 'old-town-stories',
    category: 'Local Heritage',
    duration: '2.5 hours · Flexible start',
    title: 'Old Town, Unhurried',
    description: 'See the familiar streets through a local storyteller’s eyes, discovering craft, architecture, and everyday rituals.',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Historic colorful town built into a hillside',
    highlights: ['Private local guide', 'Hidden lanes and landmarks', 'A pause for regional coffee'],
    itinerary: ['Meet your guide near the old quarter and set a comfortable pace.', 'Explore historic lanes, artisan workshops, and meaningful landmarks.', 'Pause at a neighborhood café for a regional drink and conversation.'],
    includes: ['Private heritage guide', 'Local coffee or tea', 'Small-group pace for your party'],
  },
  {
    id: 'artisan-studio',
    category: 'Local Heritage',
    duration: '2 hours · Afternoon',
    title: 'Meet the Makers',
    description: 'Spend an intimate afternoon with an artisan, learning the gestures and stories behind a treasured local craft.',
    image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Artisan workspace with handmade creative materials',
    highlights: ['One-to-one studio visit', 'Hands-on craft introduction', 'A small piece to take home'],
    itinerary: ['Arrive at a welcoming local studio and meet its maker.', 'Hear the story of the craft and try a few techniques yourself.', 'Finish with time to browse and take home your own small creation.'],
    includes: ['Private artisan host', 'Workshop materials', 'Take-home handmade keepsake'],
  },
  {
    id: 'coastal-day',
    category: 'Private Excursions',
    duration: 'Full day · By arrangement',
    title: 'A Day Along the Coast',
    description: 'Leave the itinerary to us: a private driver, tucked-away viewpoints, and a leisurely picnic beside the water.',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Quiet turquoise coastline with gentle waves',
    highlights: ['Private door-to-door transport', 'Scenic stops chosen for you', 'A locally prepared picnic'],
    itinerary: ['Set off in a private vehicle at a time that suits your day.', 'Follow a scenic route with unhurried stops and local recommendations.', 'Settle in for a picnic and enjoy the coastline at your own pace.'],
    includes: ['Private driver and vehicle', 'Curated scenic route', 'Picnic hamper and water'],
  },
  {
    id: 'countryside',
    category: 'Private Excursions',
    duration: 'Half day · Morning or afternoon',
    title: 'The Quiet Countryside',
    description: 'Trade the busy streets for open landscapes, a gentle guided walk, and the kind of views that invite you to linger.',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Mountain lake and countryside beneath a soft morning sky',
    highlights: ['Private nature guide', 'Easy-paced scenic walk', 'Refreshments in the open air'],
    itinerary: ['Travel out of town with your private guide.', 'Take a gentle walk selected to suit your group and the day.', 'Pause at a scenic spot for refreshments before the return journey.'],
    includes: ['Private nature guide', 'Transport to the trail', 'Light refreshments'],
  },
]

const Experience = () => {
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedExperience, setSelectedExperience] = useState(null)
  const [closingModal, setClosingModal] = useState(false)
  const closeTimer = useRef(null)

  const closeModal = useCallback(() => {
    setClosingModal(true)
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      setSelectedExperience(null)
      setClosingModal(false)
    }, 180)
  }, [])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  useEffect(() => {
    if (!selectedExperience) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeModal()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedExperience, closeModal])

  const visibleExperiences = activeCategory === 'All'
    ? experiences
    : experiences.filter((experience) => experience.category === activeCategory)

  const handleInquiry = (event) => {
    event.preventDefault()
    toast.success('Your concierge request is noted. We look forward to helping you plan.')
    closeModal()
  }

  const today = new Date()
  const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <main className='overflow-hidden bg-[#fbfaf7] pt-20 text-gray-800'>
      <section className='px-4 pb-12 pt-12 sm:px-6 md:px-16 md:pb-16 md:pt-16 lg:px-24 xl:px-32'>
        <div className='relative isolate overflow-hidden rounded-[2rem] bg-[#102d3a] px-5 py-10 text-white shadow-xl sm:px-7 sm:py-12 md:px-12 md:py-16 lg:px-16 lg:py-20'>
          <img
            src='https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=2000&q=85'
            alt=''
            aria-hidden='true'
            className='absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-45'
          />
          <div className='absolute inset-0 -z-10 bg-gradient-to-r from-[#102d3a]/95 via-[#102d3a]/75 to-[#102d3a]/25' />
          <div className='max-w-3xl'>
            <p className='mb-4 text-xs font-semibold uppercase tracking-[.24em] text-amber-200'>
              Stay beautifully, experience deeply
            </p>
            <h1 className='font-playfair text-3xl leading-tight sm:text-4xl md:text-5xl md:leading-[1.08] lg:text-6xl'>
              Curated Stays &amp; Signature Experiences
            </h1>
            <p className='mt-5 max-w-2xl text-base leading-7 text-white/85 md:text-lg'>
              Thoughtful moments, local connections, and little luxuries—personally shaped around the way you love to travel.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Link
                to='/rooms'
                className='inline-flex min-h-[44px] items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#173449] transition hover:bg-amber-100'
              >
                Explore Rooms <span aria-hidden='true'>→</span>
              </Link>
            </div>
          </div>
          <div className='mt-12 grid max-w-3xl grid-cols-1 gap-4 border-t border-white/25 pt-6 sm:grid-cols-3 sm:gap-6'>
            {[
              ['04', 'Signature pillars'],
              ['24/7', 'Concierge care'],
              ['100%', 'Tailored itineraries'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className='font-playfair text-2xl text-amber-200'>{value}</p>
                <p className='mt-1 text-xs uppercase tracking-[.14em] text-white/75'>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='px-4 py-12 sm:px-6 md:px-16 md:py-16 lg:px-24 xl:px-32'>
        <Title
          title='Moments Made Around You'
          subTitle='From a restorative morning to a table set just for you, discover experiences that make a stay feel entirely your own.'
        />
        <div className='mt-8 flex flex-wrap justify-center gap-2' aria-label='Filter experiences by category'>
          {categories.map((category) => (
            <button
              key={category}
              type='button'
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`min-h-[44px] rounded-full border px-3 py-2 text-sm transition sm:px-4 ${
                activeCategory === category
                  ? 'border-[#173449] bg-[#173449] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#173449] hover:text-[#173449]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className='mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {visibleExperiences.map((experience) => (
            <article key={experience.id} className='group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg'>
              <div className='relative aspect-[4/3] overflow-hidden'>
                <img
                  src={experience.image}
                  alt={experience.imageAlt}
                  loading='lazy'
                  className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
                />
                <span className='absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-[#173449] shadow-sm'>
                  {experience.category}
                </span>
              </div>
              <div className='p-5 md:p-6'>
                <p className='text-xs font-medium uppercase tracking-[.12em] text-[#92734e]'>{experience.duration}</p>
                <h2 className='mt-2 font-playfair text-2xl text-gray-900'>{experience.title}</h2>
                <p className='mt-3 text-sm leading-6 text-gray-600'>{experience.description}</p>
                <ul className='mt-4 space-y-2'>
                  {experience.highlights.map((highlight) => (
                    <li key={highlight} className='flex items-start gap-2 text-sm text-gray-600'>
                      <span className='mt-0.5 text-[#92734e]' aria-hidden='true'>✦</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type='button'
                  onClick={() => setSelectedExperience(experience)}
                  className='mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#173449] transition hover:text-[#92734e]'
                >
                  Inquire / Add to Stay <span aria-hidden='true'>→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className='bg-[#f1eee7] px-4 py-14 sm:px-6 md:px-16 md:py-20 lg:px-24 xl:px-32'>
        <Title
          title='Your Stay, Thoughtfully Orchestrated'
          subTitle='A few simple steps bring the right details together, so all that is left to do is arrive.'
        />
        <div className='mx-auto mt-12 grid max-w-6xl gap-8 md:grid-cols-3 md:gap-10'>
          {[
            {
              number: '01',
              title: 'Reserve Your Sanctuary',
              description: 'Choose a room that feels like you. Every experience can be paired with any available stay.',
            },
            {
              number: '02',
              title: 'Tailor Your Itinerary',
              description: 'Tell our concierge what you love, and we will help shape the details around your dates and pace.',
            },
            {
              number: '03',
              title: 'Arrive & Unwind',
              description: 'We take care of the thoughtful touches, leaving you free to settle in and enjoy every moment.',
            },
          ].map((step) => (
            <article key={step.number} className='border-t border-[#c9c1b2] pt-5'>
              <span className='font-playfair text-3xl text-[#92734e]'>{step.number}</span>
              <h2 className='mt-4 font-playfair text-2xl text-gray-900'>{step.title}</h2>
              <p className='mt-3 text-sm leading-6 text-gray-600'>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className='px-4 py-14 sm:px-6 md:px-16 md:py-20 lg:px-24 xl:px-32'>
        <div className='flex flex-col items-start justify-between gap-6 rounded-[1.75rem] bg-[#173449] px-5 py-8 text-white sm:px-7 sm:py-9 md:flex-row md:items-center md:px-12 md:py-12'>
          <div className='max-w-2xl'>
            <p className='text-xs font-semibold uppercase tracking-[.2em] text-amber-200'>Your next chapter begins here</p>
            <h2 className='mt-3 font-playfair text-3xl md:text-4xl'>Find a stay that feels like it was waiting for you.</h2>
            <p className='mt-3 text-sm leading-6 text-white/75'>Browse our available suites and let us help make the in-between moments unforgettable.</p>
          </div>
          <Link
            to='/rooms'
            className='inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-3 rounded-full bg-amber-200 px-6 py-3 text-sm font-semibold text-[#173449] transition hover:bg-amber-100 md:w-auto'
          >
            Browse Available Suites <span aria-hidden='true'>→</span>
          </Link>
        </div>
      </section>

      {selectedExperience && (
        <div
          className={`fixed inset-0 z-[60] overflow-y-auto bg-[#102d3a]/65 p-0 backdrop-blur-sm transition-opacity duration-200 sm:flex sm:items-center sm:justify-center sm:p-4 ${closingModal ? 'opacity-0' : 'opacity-100'}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <section
            role='dialog'
            aria-modal='true'
            aria-labelledby='experience-modal-title'
            className={`mx-4 my-4 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-[#fbfaf7] shadow-2xl transition duration-200 sm:mx-auto sm:my-0 sm:w-full ${closingModal ? 'translate-y-3 scale-[.98] opacity-0' : 'translate-y-0 scale-100 opacity-100'}`}
          >
            <div className='relative h-48 sm:h-60'>
              <img src={selectedExperience.image} alt={selectedExperience.imageAlt} className='h-full w-full object-cover' />
              <button
                type='button'
                onClick={closeModal}
                aria-label='Close experience details'
                className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl text-gray-700 shadow transition hover:bg-white'
              >
                ×
              </button>
            </div>
            <div className='grid min-w-0 gap-6 p-4 sm:gap-8 sm:p-8 lg:grid-cols-[1fr_.9fr]'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[.14em] text-[#92734e]'>{selectedExperience.category} · {selectedExperience.duration}</p>
                <h2 id='experience-modal-title' className='mt-2 font-playfair text-3xl text-gray-900'>{selectedExperience.title}</h2>
                <p className='mt-3 text-sm leading-6 text-gray-600'>{selectedExperience.description}</p>
                <h3 className='mt-6 font-semibold text-gray-800'>Your experience</h3>
                <ol className='mt-3 space-y-3'>
                  {selectedExperience.itinerary.map((item, index) => (
                    <li key={item} className='flex gap-3 text-sm leading-6 text-gray-600'>
                      <span className='font-playfair text-lg text-[#92734e]'>{index + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
                <h3 className='mt-6 font-semibold text-gray-800'>Included</h3>
                <ul className='mt-2 space-y-1.5'>
                  {selectedExperience.includes.map((item) => (
                    <li key={item} className='text-sm text-gray-600'>✓ {item}</li>
                  ))}
                </ul>
              </div>

              <form onSubmit={handleInquiry} className='rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6'>
                <h3 className='font-playfair text-2xl text-gray-900'>Ask our concierge</h3>
                <p className='mt-2 text-sm leading-6 text-gray-500'>Share a few details and we’ll help you plan around your stay.</p>
                <label className='mt-5 block text-sm font-medium text-gray-700'>
                  Preferred date
                  <input
                    type='date'
                    name='preferredDate'
                    min={minimumDate}
                    required
                    className='mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#92734e]'
                  />
                </label>
                <label className='mt-4 block text-sm font-medium text-gray-700'>
                  Number of guests
                  <input
                    type='number'
                    name='guests'
                    min='1'
                    max='20'
                    defaultValue='2'
                    required
                    className='mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#92734e]'
                  />
                </label>
                <label className='mt-4 block text-sm font-medium text-gray-700'>
                  Special notes
                  <textarea
                    name='notes'
                    rows='3'
                    placeholder='Dietary needs, occasions, or anything you would like us to know'
                    className='mt-1.5 w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#92734e]'
                  />
                </label>
                <button
                  type='submit'
                  className='mt-5 w-full rounded-lg bg-[#173449] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244b61]'
                >
                  Send Concierge Request
                </button>
                <p className='mt-3 text-center text-xs text-gray-400'>No booking is made until your stay details are confirmed.</p>
              </form>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default Experience

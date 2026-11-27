import { useState } from 'react'
import { Link } from 'react-router-dom'
import Title from '../components/Title'

const pillars = [
  {
    number: '01',
    title: 'Thoughtful Architecture & Design',
    description: 'Spaces with a sense of place—considered materials, natural light, and details that make it easy to feel at home.',
    icon: (
      <>
        <path d='M3 10.5 12 3l9 7.5' />
        <path d='M5.5 9.5V21h13V9.5M9 21v-7h6v7' />
        <path d='M8 10h.01M16 10h.01' />
      </>
    ),
  },
  {
    number: '02',
    title: 'Authentic Local Culture',
    description: 'Rooted in the neighborhoods we love, our stays open the door to local makers, flavors, and everyday rituals.',
    icon: (
      <>
        <circle cx='12' cy='12' r='9' />
        <path d='M3.5 9h17M4 15h16M12 3c2.2 2.4 3.2 5.4 3.2 9s-1 6.6-3.2 9c-2.2-2.4-3.2-5.4-3.2-9S9.8 5.4 12 3Z' />
      </>
    ),
  },
  {
    number: '03',
    title: 'Seamless, Secure Booking',
    description: 'A straightforward booking journey with secure checkout, clear stay details, and thoughtful support when you need it.',
    icon: (
      <>
        <rect x='4' y='10' width='16' height='11' rx='2' />
        <path d='M8 10V7a4 4 0 0 1 8 0v3M12 14v3' />
      </>
    ),
  },
  {
    number: '04',
    title: 'Personalized Guest Care',
    description: 'From the first question to the final morning, our team brings a warm, attentive touch to every part of your stay.',
    icon: (
      <>
        <path d='M20.8 8.7c0 5.1-8.8 11.1-8.8 11.1S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z' />
        <path d='M7.5 11.5h2l1.2-2.2 2.1 4.4 1.3-2.2h2.4' />
      </>
    ),
  },
]

const faqs = [
  {
    question: 'What are the usual check-in and check-out times?',
    answer: 'Arrival and departure times depend on the property. Your exact times and check-in instructions are shared with your booking details. If you need flexibility, let us know and we will check what can be arranged.',
  },
  {
    question: 'Can you help me plan experiences during my stay?',
    answer: 'Absolutely. Browse the curated experiences on our Experience page and send a concierge inquiry with your preferred date and group size. The team can help confirm availability and tailor the details.',
  },
  {
    question: 'Is payment handled securely?',
    answer: 'Online card payments are handled through Stripe Checkout. Available payment methods are shown during checkout, and your card details are processed securely by Stripe.',
  },
  {
    question: 'What if I need to change or cancel my stay?',
    answer: 'Cancellation and change terms vary by property and rate. Review the terms shown for your selected stay before completing your booking; those terms determine the options available afterward.',
  },
  {
    question: 'Can you accommodate special requests?',
    answer: 'Share your needs or preferences with us as early as you can. We will do our best to coordinate with the property, and will confirm what can be accommodated.',
  },
]

const About = () => {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <main className='overflow-hidden bg-[#fbfaf7] pt-20 text-gray-800'>
      <section className='px-4 pb-12 pt-12 sm:px-6 md:px-16 md:pb-16 md:pt-16 lg:px-24 xl:px-32'>
        <div className='relative isolate min-h-[440px] overflow-hidden rounded-[2rem] bg-[#102d3a] px-5 py-10 text-white shadow-xl sm:min-h-[520px] sm:px-7 sm:py-12 md:px-12 md:py-16 lg:flex lg:items-center lg:px-16 lg:py-20'>
          <img
            src='https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=85'
            alt='Warm, thoughtfully designed boutique hotel interior'
            className='absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-55'
          />
          <div className='absolute inset-0 -z-10 bg-gradient-to-r from-[#102d3a]/95 via-[#102d3a]/75 to-[#102d3a]/25' />
          <div className='max-w-3xl'>
            <p className='mb-4 text-xs font-semibold uppercase tracking-[.24em] text-amber-200'>
              The Ganeshaya Stays story
            </p>
            <h1 className='font-playfair text-3xl leading-tight sm:text-4xl md:text-5xl md:leading-[1.08] lg:text-6xl'>
              Where Timeless Indian Warmth Meets Modern Sanctuary
            </h1>
            <p className='mt-5 max-w-2xl text-base leading-7 text-white/85 md:text-lg'>
              We believe the best stays do more than give you somewhere to sleep. They make you feel welcomed, grounded, and connected to the place around you.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Link
                to='/rooms'
                className='inline-flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#173449] transition hover:bg-amber-100 sm:w-auto'
              >
                Discover Our Stays <span aria-hidden='true'>→</span>
              </Link>
              <Link
                to='/experience'
                className='inline-flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto'
              >
                Explore Experiences
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='px-4 py-12 sm:px-6 md:px-16 md:py-16 lg:px-24 xl:px-32'>
        <div className='grid min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16'>
          <div>
            <p className='mb-3 text-xs font-semibold uppercase tracking-[.2em] text-[#92734e]'>Our story &amp; philosophy</p>
            <h2 className='font-playfair text-3xl leading-tight text-gray-900 md:text-5xl'>
              A stay should feel like a welcome, not a transaction.
            </h2>
            <div className='mt-6 space-y-4 text-sm leading-7 text-gray-600 md:text-base'>
              <p>
                Ganeshaya Stays began with a simple vision: to bring together intimate, design-forward boutique stays and private villas that feel genuinely connected to their surroundings.
              </p>
              <p>
                We look for places with character—where architecture invites you to slow down, where local details have meaning, and where the small things are considered before you arrive.
              </p>
              <p>
                Inspired by the generous warmth of Indian hospitality and shaped for the way we travel today, we bring care, clarity, and a personal touch to every journey.
              </p>
            </div>
            <Link to='/rooms' className='mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#173449] transition hover:text-[#92734e]'>
              Find your sanctuary <span aria-hidden='true'>→</span>
            </Link>
          </div>

          <div className='relative mx-auto w-full min-w-0 max-w-xl pb-10 pl-5 sm:pl-10'>
            <div className='overflow-hidden rounded-[1.75rem] shadow-lg'>
              <img
                src='https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85'
                alt='Sunlit boutique suite with natural materials and a calm, modern design'
                loading='lazy'
                className='aspect-[4/3] w-full object-cover'
              />
            </div>
            <div className='absolute bottom-0 right-0 w-2/3 overflow-hidden rounded-2xl border-4 border-[#fbfaf7] shadow-xl sm:w-1/2'>
              <img
                src='https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=900&q=85'
                alt='A welcoming lounge with warm lighting and considered details'
                loading='lazy'
                className='aspect-[5/3] w-full object-cover'
              />
            </div>
            <blockquote className='absolute left-0 top-6 max-w-[190px] rounded-xl bg-white/95 p-4 shadow-lg sm:top-10 sm:max-w-[220px] sm:p-5'>
              <span className='font-playfair text-3xl leading-none text-[#92734e]' aria-hidden='true'>“</span>
              <p className='mt-1 font-playfair text-base leading-snug text-[#173449] sm:text-lg'>
                The most memorable luxury is feeling truly looked after.
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      <section className='bg-[#f1eee7] px-4 py-10 sm:px-6 md:px-16 md:py-14 lg:px-24 xl:px-32'>
        <div className='mx-auto grid max-w-6xl grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-6'>
          {[
            ['25+', 'Curated properties'],
            ['98%', 'Guest satisfaction'],
            ['24/7', 'Dedicated concierge'],
            ['4.9★', 'Average guest rating'],
          ].map(([value, label]) => (
            <div key={label} className='text-center'>
              <p className='font-playfair text-3xl text-[#173449] md:text-4xl'>{value}</p>
              <p className='mt-2 text-xs uppercase tracking-[.12em] text-gray-500 sm:text-sm'>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='px-4 py-14 sm:px-6 md:px-16 md:py-20 lg:px-24 xl:px-32'>
        <Title
          title='The Care Behind Every Stay'
          subTitle='Our hospitality is built on thoughtful choices, genuine connections, and the confidence that someone is there when you need them.'
        />
        <div className='mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4'>
          {pillars.map((pillar) => (
            <article key={pillar.number} className='rounded-2xl border border-[#e7e1d7] bg-white p-6 transition hover:border-[#c9b99f] hover:shadow-md'>
              <div className='flex items-center justify-between'>
                <span className='flex h-12 w-12 items-center justify-center rounded-full bg-[#f1eee7] text-[#92734e]'>
                  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='h-6 w-6' aria-hidden='true'>
                    {pillar.icon}
                  </svg>
                </span>
                <span className='font-playfair text-xl text-[#c5b69d]'>{pillar.number}</span>
              </div>
              <h3 className='mt-6 font-playfair text-xl leading-snug text-gray-900'>{pillar.title}</h3>
              <p className='mt-3 text-sm leading-6 text-gray-600'>{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className='bg-[#f1eee7] px-4 py-14 sm:px-6 md:px-16 md:py-20 lg:px-24 xl:px-32'>
        <div className='mx-auto max-w-3xl'>
          <Title
            title='Everything You Should Know'
            subTitle='A few helpful details before you begin planning your stay.'
          />
          <div className='mt-9 divide-y divide-[#d8d0c3] border-y border-[#d8d0c3]'>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              const answerId = `about-faq-answer-${index}`
              return (
                <article key={faq.question} className='py-1'>
                  <h3>
                    <button
                      type='button'
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className='flex w-full items-center justify-between gap-3 py-4 text-left sm:gap-5'
                    >
                      <span className='min-w-0 flex-1 font-playfair text-lg text-gray-900 md:text-xl'>{faq.question}</span>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c9c1b2] text-lg text-[#173449] transition-transform ${isOpen ? 'rotate-45' : ''}`} aria-hidden='true'>+</span>
                    </button>
                  </h3>
                  <div id={answerId} hidden={!isOpen} className='max-w-2xl pb-5 pr-10 text-sm leading-6 text-gray-600'>
                    {faq.answer}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className='px-4 py-14 sm:px-6 md:px-16 md:py-20 lg:px-24 xl:px-32'>
        <div className='relative isolate overflow-hidden rounded-[1.75rem] bg-[#173449] px-5 py-8 text-white sm:px-7 sm:py-10 md:px-12 md:py-14'>
          <img
            src='https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80'
            alt=''
            aria-hidden='true'
            loading='lazy'
            className='absolute inset-0 -z-20 h-full w-full object-cover opacity-20'
          />
          <div className='absolute inset-0 -z-10 bg-gradient-to-r from-[#173449] via-[#173449]/95 to-[#173449]/70' />
          <div className='flex flex-col items-start justify-between gap-7 md:flex-row md:items-center'>
            <div className='max-w-2xl'>
              <p className='text-xs font-semibold uppercase tracking-[.2em] text-amber-200'>A little more you, in every journey</p>
              <h2 className='mt-3 font-playfair text-3xl md:text-4xl'>Let us help you find your kind of getaway.</h2>
              <p className='mt-3 text-sm leading-6 text-white/75'>Explore places with character and experiences that bring each destination closer.</p>
            </div>
            <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
              <Link to='/experience' className='inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10'>
                Explore Experiences <span aria-hidden='true'>→</span>
              </Link>
              <Link to='/rooms' className='inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-amber-200 px-5 py-3 text-sm font-semibold text-[#173449] transition hover:bg-amber-100'>
                Browse Rooms <span aria-hidden='true'>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default About
